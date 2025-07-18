import { Injectable, HttpException, Logger } from '@nestjs/common';
import { axiosKlaviyo } from '@/common/axios-instance';
import { KlaviyoMetric } from '../interfaces/klaviyo-metric.interface';
import { MetricEmailSummary } from '../interfaces/metric-email-summary.interface';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class MetricService {
    private readonly apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    private readonly logger = new Logger(MetricService.name);

    constructor(private readonly analyticsService: AnalyticsService) {}

    async getAllMetrics(): Promise<{ success: boolean; total: number; data: KlaviyoMetric[] }> {
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
            throw new HttpException(errorData, error?.response?.status || 500);
        }
    }

    async findMetricByName(name: string): Promise<KlaviyoMetric | null> {
        const metrics = (await this.getAllMetrics()).data;
        return metrics.find(m => m.attributes?.name === name) || null;
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
                    const allEvents = await this.analyticsService.getAllEvents({
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
            const allEvents = await this.analyticsService.getAllEvents({
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
}
