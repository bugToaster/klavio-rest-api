import { Injectable, HttpException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KlaviyoEventLog } from './entities/klaviyo-event-log.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { axiosKlaviyo } from '@/common/axios-instance';

@Injectable()
export class EventService {
    private readonly apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    private readonly logger = new Logger(EventService.name);

    constructor(
        @InjectRepository(KlaviyoEventLog)
        private readonly eventLogRepo: Repository<KlaviyoEventLog>,
        private readonly dataSource: DataSource,
    ) {}

    private async _callKlaviyoAPI<T = any>(
        endpoint: string,
        payloadOrParams?: any,
        method: 'post' | 'get' = 'post'
    ): Promise<T> {
        try {
            const config: any = {
                method,
                url: `https://a.klaviyo.com/api/${endpoint}`,
                headers: {
                    Authorization: `Klaviyo-API-Key ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Revision: '2025-07-15',
                },
            };

            if (method === 'get') {
                config.params = payloadOrParams;
            } else {
                config.data = payloadOrParams;
            }

            const response = await axiosKlaviyo.request<T>(config);
            return response.data;
        } catch (error) {
            this.logger.error(`[Klaviyo API Error - ${endpoint}]`, error);
            throw error;
        }
    }

    async sendEvents(events: CreateEventDto | CreateEventDto[]) {
        const isBulk = Array.isArray(events);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (isBulk) {
                for (const event of events) {
                    await queryRunner.manager.save(KlaviyoEventLog, {
                        eventName: event.eventName,
                        eventAttributes: event.eventAttributes,
                        profileAttributes: event.profileAttributes,
                        timestamp: event.timestamp,
                        value: event.value,
                        uniqueId: event.uniqueId,
                    });
                }
            } else {
                const event = events as CreateEventDto;
                await queryRunner.manager.save(KlaviyoEventLog, {
                    eventName: event.eventName,
                    eventAttributes: event.eventAttributes,
                    profileAttributes: event.profileAttributes,
                    timestamp: event.timestamp,
                    value: event.value,
                    uniqueId: event.uniqueId,
                });
            }

            const payload = isBulk
                ? this._buildBulkPayload(events)
                : this._buildSinglePayload(events as CreateEventDto);
            const endpoint = isBulk ? 'event-bulk-create-jobs' : 'events';
            const response = await this._callKlaviyoAPI(endpoint, payload, 'post');

            await queryRunner.commitTransaction();

            return {
                success: true,
                message: isBulk
                    ? 'Bulk events sent to Klaviyo and logged successfully'
                    : 'Event sent to Klaviyo and logged successfully',
                data: response,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            const errResponse = error?.response?.data ?? error.message;
            this.logger.error(`[Klaviyo Send Event Error]`, error);

            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to send event to Klaviyo',
                    error: errResponse,
                },
                error?.response?.status || 500
            );
        } finally {
            await queryRunner.release();
        }
    }


    private _buildSinglePayload(event: CreateEventDto) {
        return {
            data: {
                type: 'event',
                attributes: {
                    properties: event.eventAttributes || {},
                    metric: {
                        data: {
                            type: 'metric',
                            attributes: {
                                name: event.eventName,
                                service: 'custom',
                            },
                        },
                    },
                    profile: {
                        data: {
                            type: 'profile',
                            attributes: event.profileAttributes,
                        },
                    },
                    time: event.timestamp || new Date().toISOString(),
                    value: event.value || undefined,
                    value_currency: event.value_currency || 'USD',
                    unique_id: event.uniqueId || undefined,
                },
            },
        };
    }

    private _buildBulkPayload(events: CreateEventDto[]) {
        return {
            data: {
                type: 'event-bulk-create-job',
                attributes: {
                    'events-bulk-create': {
                        data: events.map(event => ({
                            type: 'event-bulk-create',
                            attributes: {
                                profile: {
                                    data: {
                                        type: 'profile',
                                        attributes: event.profileAttributes,
                                    },
                                },
                                events: {
                                    data: [
                                        {
                                            type: 'event',
                                            attributes: {
                                                properties: event.eventAttributes || {},
                                                time: event.timestamp || new Date().toISOString(),
                                                value: event.value || undefined,
                                                value_currency: event.value_currency || 'USD',
                                                metric: {
                                                    data: {
                                                        type: 'metric',
                                                        attributes: {
                                                            name: event.eventName,
                                                            service: 'custom',
                                                        },
                                                    },
                                                },
                                                unique_id: event.uniqueId || undefined,
                                            },
                                        },
                                    ],
                                },
                            },
                        })),
                    },
                },
            },
        };
    }

    async getEvents(query: GetEventsQueryDto) {
        const { metricName, pageSize = 50, cursor } = query;

        const params: Record<string, any> = {
            'page[size]': pageSize,
            include: 'metric',
            'fields[metric]': 'name,created,updated',
        };

        if (cursor) {
            params['page[cursor]'] = cursor;
        }

        if (metricName) {
            const metricsRes = await this._callKlaviyoAPI('metrics', {}, 'get');
            const matchedMetric = metricsRes?.data?.find(
                (m) => m.attributes?.name === metricName
            );

            if (!matchedMetric) {
                throw new HttpException(
                    {
                        success: false,
                        message: `Metric name '${metricName}' not found.`,
                    },
                    400
                );
            }

        }

        try {
            const data = await this._callKlaviyoAPI('events', params, 'get');

            return {
                success: true,
                message: 'Fetched events from Klaviyo',
                data,
            };
        } catch (error) {
            const errResponse = error?.response?.data ?? error.message;
            this.logger.error('Failed to fetch events from Klaviyo', error);

            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch events from Klaviyo',
                    error: errResponse,
                },
                error?.response?.status || 500
            );
        }
    }
}
