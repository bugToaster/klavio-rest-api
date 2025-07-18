import {Injectable, HttpException, Logger} from '@nestjs/common';
import {CreateEventDto} from './dto/create-event.dto';
import {CreateBulkEventDto} from './dto/create-bulk-event.dto';

import {axiosKlaviyo} from '@/common/axios-instance';
import {KlaviyoMetric} from './interfaces/klaviyo-metric.interface';
import { MetricEmailSummary } from './interfaces/metric-email-summary.interface';


@Injectable()
export class EventService {
    private readonly apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    private readonly logger = new Logger(EventService.name);

    async createEvent(dto: CreateEventDto) {
        try {
            const data = await this._sendToKlaviyo(dto);

            return {
                success: true,
                message: 'Event successfully sent to Klaviyo',
                eventName: dto.eventName,
                profile: dto.profileAttributes,
                response: data,
            };
        } catch (error) {
            const errResponse = error?.response?.data ?? error.message;
            this.logger.error(`Failed to send event: ${dto.eventName}`, error);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to send event to Klaviyo',
                    error: errResponse,
                },
                error?.response?.status || 500,
            );
        }
    }

    async createBulkEvents(dto: CreateBulkEventDto) {
        const results: {
            success: boolean;
            eventName: string;
            profile: Record<string, any>;
            data?: any;
            error?: any;
        }[] = [];

        for (const event of dto.events) {
            try {
                const data = await this._sendToKlaviyo(event);
                results.push({
                    success: true,
                    eventName: event.eventName,
                    profile: event.profileAttributes,
                    data,
                });
            } catch (error) {
                const errResponse = error?.response?.data ?? error.message;
                this.logger.error(`Failed to send event: ${event.eventName}`, error);
                results.push({
                    success: false,
                    eventName: event.eventName,
                    profile: event.profileAttributes,
                    error: errResponse,
                });
            }
        }

        return {
            total: dto.events.length,
            successCount: results.filter((r) => r.success).length,
            failedCount: results.filter((r) => !r.success).length,
            results,
        };
    }

    private async _sendToKlaviyo(dto: CreateEventDto) {
        try {
            const response = await axiosKlaviyo.post(
                'events/',
                {
                    data: {
                        type: 'event',
                        attributes: {
                            metric: {name: dto.eventName},
                            profile: dto.profileAttributes,
                            properties: dto.eventAttributes || {},
                            // timestamp removed — not allowed by Klaviyo
                        },
                    },
                },
                {
                    headers: {
                        Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                    },
                },
            );

            return response.data;
        } catch (error) {
            console.error('[Klaviyo Error]', JSON.stringify(error?.response?.data, null, 2));
            throw error;
        }
    }

    async getAllMetrics(): Promise<{ success: boolean; total: number; data: KlaviyoMetric[]; }> {
        const allMetrics: KlaviyoMetric[] = [];
        let nextCursor: string | null = null;

        try {
            do {
                const params: Record<string, string> = {};
                if (nextCursor) {
                    params['page[cursor]'] = nextCursor;
                }

                const response = await axiosKlaviyo.get('metrics/', {
                    headers: {
                        Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                    },
                    params,
                });

                const currentData: KlaviyoMetric[] = response.data?.data || [];
                allMetrics.push(...currentData);

                const nextLink = response.data?.links?.next;
                nextCursor = nextLink
                    ? new URL(nextLink).searchParams.get('page[cursor]')
                    : null;
            } while (nextCursor);

            return {
                success: true,
                total: allMetrics.length,
                data: allMetrics,
            };
        } catch (error: any) {
            const errorData = error?.response?.data || error.message;
            this.logger.error('[Klaviyo Metrics Error]', errorData);
            throw new HttpException(
                errorData,
                error?.response?.status || 500
            );
        }
    }

    async findMetricByName(name: string): Promise<KlaviyoMetric | null> {
        const metrics = (await this.getAllMetrics()).data;
        return metrics.find(m => m.attributes?.name === name) || null;
    }


    async getAllEvents(params: { metricId?: string; startDate?: string; endDate?: string; }): Promise<any[]> {
        const { metricId, startDate, endDate } = params;
        const allEvents: any[] = [];
        const profileCache: Record<string, string | null> = {}; // profileId -> email
        let nextCursor: string | null = null;

        try {
            do {
                const filters: string[] = [];

                if (metricId) filters.push(`equals(metric_id,"${metricId}")`);
                if (startDate)
                    filters.push(`greater-or-equal(datetime,${new Date(startDate).toISOString()})`);
                if (endDate)
                    filters.push(`less-than(datetime,${new Date(endDate).toISOString()})`);

                const queryParams: Record<string, any> = {
                    sort: '-datetime',
                    'page[size]': 100,
                };

                if (filters.length) queryParams['filter'] = filters.join(',');
                if (nextCursor) queryParams['page[cursor]'] = nextCursor;

                const res = await axiosKlaviyo.get('events/', {
                    headers: {
                        Authorization: `Klaviyo-API-Key ${this.apiKey}`
                    },
                    params: queryParams
                });

                const events = res.data?.data || [];

                for (const event of events) {
                    const profileId = event.attributes?.profile_id;

                    if (profileId) {
                        if (!(profileId in profileCache)) {
                            try {
                                const profileRes = await axiosKlaviyo.get(`profiles/${profileId}`, {
                                    headers: {
                                        Authorization: `Klaviyo-API-Key ${this.apiKey}`
                                    }
                                });
                                const email = profileRes.data?.data?.attributes?.email ?? null;
                                profileCache[profileId] = email;
                            } catch (err) {
                                this.logger.warn(`Failed to fetch profile for ${profileId}`);
                                profileCache[profileId] = null;
                            }
                        }

                        event.profileEmail = profileCache[profileId];
                    } else {
                        event.profileEmail = null;
                    }

                    allEvents.push(event);
                }

                const nextLink = res.data?.links?.next;
                nextCursor = nextLink
                    ? new URL(nextLink).searchParams.get('page[cursor]')
                    : null;

            } while (nextCursor);

            return allEvents;

        } catch (err: any) {
            const errorData = err.response?.data || err.message;
            this.logger.error('Failed to fetch events', errorData);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch Klaviyo events',
                    error: errorData
                },
                err?.response?.status || 500
            );
        }
    }


    async getMetricCountsByDateOnly(date: string): Promise<MetricEmailSummary[]> {
        const results: MetricEmailSummary[] = [];

        try {
            const metricsRes = await this.getAllMetrics();
            const metrics = metricsRes?.data || [];

            for (const metric of metrics) {
                const metricId = metric?.id;
                const metricName = metric?.attributes?.name || 'Unnamed';

                if (!metricId) {
                    this.logger.warn(`Skipping metric with missing ID: "${metricName}"`);
                    continue;
                }

                const startDate = date;
                const endDateObj = new Date(date);
                endDateObj.setDate(endDateObj.getDate() + 1);
                const endDate = endDateObj.toISOString().split('T')[0];

                try {
                    const allEvents = await this.getAllEvents({
                        metricId,
                        startDate,
                        endDate,
                    });

                    const emails = allEvents.map(e => e.profileEmail).filter(Boolean);

                    results.push({
                        metric: metricName,
                        date,
                        count: allEvents.length,
                        emails,
                    });

                } catch (err: any) {
                    this.logger.warn(`Metric "${metricName}" failed: ${err.message}`);
                    results.push({
                        metric: metricName,
                        date,
                        count: 0,
                        emails: [],
                        error: err?.response?.data || err.message,
                    });
                }
            }

            return results;

        } catch (err: any) {
            this.logger.error('getMetricCountsByDateOnly() failed:', err);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to get metrics counts',
                    error: err?.response?.data || err.message,
                },
                err?.response?.status || 500,
            );
        }
    }


    async getMetricByNameAndDate(metricName: string, date: string): Promise<MetricEmailSummary> {
        const metricsRes = await this.getAllMetrics();
        const metrics = metricsRes.data || [];

        const matchedMetric = metrics.find(
            m => m.attributes?.name?.toLowerCase() === metricName.toLowerCase()
        );

        if (!matchedMetric) {
            throw new HttpException(`Metric "${metricName}" not found`, 404);
        }

        const metricId = matchedMetric.id;
        const startDate = date;
        const endDateObj = new Date(date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDate = endDateObj.toISOString().split('T')[0];

        try {
            const allEvents = await this.getAllEvents({
                metricId,
                startDate,
                endDate,
            });

            const emails = allEvents.map(e => e.profileEmail).filter(Boolean);

            return {
                metric: metricName,
                date,
                count: allEvents.length,
                emails,
            };

        } catch (err: any) {
            this.logger.warn(`Metric "${metricName}" failed: ${err.message}`);
            return {
                metric: metricName,
                date,
                count: 0,
                emails: [],
                error: err?.response?.data || err.message,
            };
        }
    }


    async getEventsByEmailAndDate(email: string, date: string) {
        try {

            const profileRes = await axiosKlaviyo.get(`profiles/?filter=equals(email,"${email}")`, {
                headers: { Authorization: `Klaviyo-API-Key ${this.apiKey}` }
            });

            const profile = profileRes.data?.data?.[0];
            if (!profile?.id) {
                throw new HttpException(`No profile found for email: ${email}`, 404);
            }

            const profileId = profile.id;


            const start = new Date(date);
            const end = new Date(start);
            end.setDate(start.getDate() + 1);

            const filters: string[] = [
                `equals(profile_id,"${profileId}")`,
                `greater-or-equal(datetime,${start.toISOString()})`,
                `less-than(datetime,${end.toISOString()})`
            ];

            const events: any[] = [];
            let nextCursor: string | null = null;

            do {
                const params: Record<string, any> = {
                    sort: '-datetime',
                    'page[size]': 100,
                    filter: filters.join(',')
                };

                if (nextCursor) params['page[cursor]'] = nextCursor;

                const res = await axiosKlaviyo.get('events/', {
                    headers: { Authorization: `Klaviyo-API-Key ${this.apiKey}` },
                    params
                });

                events.push(...(res.data?.data || []));

                const nextLink = res.data?.links?.next;
                nextCursor = nextLink
                    ? new URL(nextLink).searchParams.get('page[cursor]')
                    : null;
            } while (nextCursor);

            return {
                email,
                date,
                total: events.length,
                events
            };

        } catch (err: any) {
            const errorData = err?.response?.data || err.message;
            this.logger.error('getEventsByEmailAndDate() failed', errorData);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch events',
                    error: errorData
                },
                err?.response?.status || 500
            );
        }
    }

    async getProfileByEmail(email: string): Promise<any> {
        try {
            const res = await axiosKlaviyo.get('profiles/', {
                headers: {
                    Authorization: `Klaviyo-API-Key ${this.apiKey}`
                },
                params: {
                    filter: `equals(email,"${email}")`
                }
            });

            const profile = res.data?.data?.[0] ?? null;

            if (!profile) {
                throw new HttpException(`No profile found for email: ${email}`, 404);
            }

            return {
                success: true,
                email,
                profileAttributes: profile.attributes
            };

        } catch (err: any) {
            this.logger.error(`Failed to fetch profile for ${email}`, err?.response?.data || err.message);
            throw new HttpException(
                {
                    message: 'Failed to fetch profile',
                    error: err?.response?.data || err.message
                },
                err?.response?.status || 500
            );
        }
    }

    async getProfileMetricsByEmail(email: string): Promise<{
        email: string;
        totalEvents: number;
        metricSummary: Record<string, number>;
    }> {
        try {
            const allMetrics = await this.getAllMetrics();
            const metricsMap = new Map<string, string>();
            for (const metric of allMetrics.data) {
                metricsMap.set(metric.id, metric.attributes?.name || 'Unknown');
            }

            const allEvents = await this.getAllEvents({});

            const filtered = allEvents.filter(e => e.profileEmail === email);

            const summary: Record<string, number> = {};
            for (const event of filtered) {
                const metricId = event.attributes?.metric_id;
                const name = metricsMap.get(metricId) || 'Unknown';
                summary[name] = (summary[name] || 0) + 1;
            }

            return {
                email,
                totalEvents: filtered.length,
                metricSummary: summary
            };
        } catch (err: any) {
            this.logger.error('getProfileMetricsByEmail() failed:', err);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to get profile metrics',
                    error: err?.response?.data || err.message
                },
                err?.response?.status || 500
            );
        }
    }

}
