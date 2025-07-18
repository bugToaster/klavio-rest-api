import {Injectable, HttpException, Logger} from '@nestjs/common';
import {CreateEventDto} from './dto/create-event.dto';
import {CreateBulkEventDto} from './dto/create-bulk-event.dto';

import {axiosKlaviyo} from '@/common/axios-instance';
import {KlaviyoMetric} from './interfaces/klaviyo-metric.interface';


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

    async getFirstPageOfMetrics(): Promise<{
        success: boolean;
        total: number;
        data: KlaviyoMetric[];
    }> {
        try {
            const response = await axiosKlaviyo.get('metrics/', {
                headers: {
                    Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                },
            });

            const data = response.data?.data || [];

            return {
                success: true,
                total: data.length,
                data,
            };
        } catch (error) {
            console.error('[Klaviyo Metrics Error]', JSON.stringify(error?.response?.data, null, 2));
            throw new HttpException(
                error?.response?.data || 'Failed to fetch metrics from Klaviyo',
                error?.response?.status || 500,
            );
        }
    }


}
