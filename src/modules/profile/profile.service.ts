import {Injectable, HttpException, Logger} from '@nestjs/common';
import {axiosKlaviyo} from '@/common/axios-instance';
import {AnalyticsService} from '../analytics/analytics.service';
import {MetricService} from '../metric/metric.service';
import {KlaviyoMetric} from '../interfaces/klaviyo-metric.interface';

@Injectable()
export class ProfileService {
    private readonly apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    private readonly logger = new Logger(ProfileService.name);

    constructor(private readonly analyticsService: AnalyticsService, private readonly metricService: MetricService,) {
    }

    async getProfileByEmail(email: string): Promise<any> {
        try {
            const res = await axiosKlaviyo.get('profiles/', {
                headers: {
                    Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                },
                params: {
                    filter: `equals(email,"${email}")`,
                },
            });

            const profile = res.data?.data?.[0] ?? null;

            if (!profile) {
                throw new HttpException(`No profile found for email: ${email}`, 404);
            }

            return {
                success: true,
                email,
                profileAttributes: profile.attributes,
            };
        } catch (err: any) {
            this.logger.error(`Failed to fetch profile for ${email}`, err?.response?.data || err.message);
            throw new HttpException(
                {
                    message: 'Failed to fetch profile',
                    error: err?.response?.data || err.message,
                },
                err?.response?.status || 500,
            );
        }
    }

    async getProfileMetricsByEmail(email: string): Promise<{
        email: string;
        totalEvents: number;
        metricSummary: Record<string, number>;
    }> {
        try {
            const allMetrics = await this.metricService.getAllMetrics();

            const metricsMap = new Map<string, string>();
            for (const metric of allMetrics.data) {
                metricsMap.set(metric.id, metric.attributes?.name || 'Unknown');
            }

            const allEvents = await this.analyticsService.getAllEvents({});


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
    async mergeProfiles(primaryProfileId: string, duplicateProfileId: string): Promise<any> {
        try {
            const response = await axiosKlaviyo.post(
                'profile-merge',
                {
                    data: {
                        type: 'profile-merge',
                        id: primaryProfileId,
                        relationships: {
                            profiles: {
                                data: [
                                    {
                                        type: 'profile',
                                        id: duplicateProfileId,
                                    },
                                ],
                            },
                        },
                    },
                },
                {
                    headers: {
                        Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                        'Content-Type': 'application/vnd.api+json',
                        Accept: 'application/vnd.api+json',
                        revision: '2023-10-15', // required by Klaviyo API
                    },
                }
            );

            return {
                success: true,
                message: 'Profiles merged successfully',
                data: response.data,
            };
        } catch (err: any) {
            this.logger.error(
                `Failed to merge profiles: ${primaryProfileId} <- ${duplicateProfileId}`,
                err?.response?.data || err.message
            );
            throw new HttpException(
                {
                    message: 'Failed to merge profiles',
                    error: err?.response?.data || err.message,
                },
                err?.response?.status || 500
            );
        }
    }


    async getAllProfiles(query: { size?: number; cursor?: string }): Promise<any> {
        try {
            const params: any = {};
            if (query.size) params['page[size]'] = query.size;
            if (query.cursor) params['page[cursor]'] = query.cursor;

            const res = await axiosKlaviyo.get('profiles', {
                headers: {
                    Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                },
                params,
            });

            return {
                success: true,
                data: res.data?.data || [],
                pagination: res.data?.links || {},
            };
        } catch (err: any) {
            this.logger.error('Failed to fetch all profiles', err?.response?.data || err.message);
            throw new HttpException(
                {
                    message: 'Failed to fetch profiles',
                    error: err?.response?.data || err.message,
                },
                err?.response?.status || 500
            );
        }
    }


}
