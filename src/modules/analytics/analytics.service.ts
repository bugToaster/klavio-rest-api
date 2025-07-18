import { Injectable, HttpException, Logger } from '@nestjs/common';
import { axiosKlaviyo } from '@/common/axios-instance';

@Injectable()
export class AnalyticsService {
    private readonly apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    private readonly logger = new Logger(AnalyticsService.name);

    async getAllEvents(params: { metricId?: string; startDate?: string; endDate?: string; }): Promise<any[]> {
        const { metricId, startDate, endDate } = params;
        const allEvents: any[] = [];
        const profileCache: Record<string, string | null> = {};
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
                        Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                    },
                    params: queryParams,
                });

                const events = res.data?.data || [];

                for (const event of events) {
                    const profileId = event.attributes?.profile_id;

                    if (profileId) {
                        if (!(profileId in profileCache)) {
                            try {
                                const profileRes = await axiosKlaviyo.get(`profiles/${profileId}`, {
                                    headers: {
                                        Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                                    },
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
                    error: errorData,
                },
                err?.response?.status || 500,
            );
        }
    }

    async getEventsByEmailAndDate(email: string, date: string) {
        try {
            const profileRes = await axiosKlaviyo.get(`profiles/?filter=equals(email,"${email}")`, {
                headers: { Authorization: `Klaviyo-API-Key ${this.apiKey}` },
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
                `less-than(datetime,${end.toISOString()})`,
            ];

            const events: any[] = [];
            let nextCursor: string | null = null;

            do {
                const params: Record<string, any> = {
                    sort: '-datetime',
                    'page[size]': 100,
                    filter: filters.join(','),
                };

                if (nextCursor) params['page[cursor]'] = nextCursor;

                const res = await axiosKlaviyo.get('events/', {
                    headers: { Authorization: `Klaviyo-API-Key ${this.apiKey}` },
                    params,
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
                events,
            };
        } catch (err: any) {
            const errorData = err?.response?.data || err.message;
            this.logger.error('getEventsByEmailAndDate() failed', errorData);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch events',
                    error: errorData,
                },
                err?.response?.status || 500,
            );
        }
    }
}
