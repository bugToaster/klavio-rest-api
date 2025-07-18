import { Injectable, HttpException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { KlaviyoEventLog } from './entities/klaviyo-event-log.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateBulkEventDto } from './dto/create-bulk-event.dto';
import { BulkEventResult } from '../interfaces/bulk-event-result.interface';
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

    async createEvent(dto: CreateEventDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.manager.save(KlaviyoEventLog, {
                eventName: dto.eventName,
                eventAttributes: dto.eventAttributes,
                profileAttributes: dto.profileAttributes,
            });

            const data = await this._sendToKlaviyo(dto);

            const threshold = new Date();
            threshold.setDate(threshold.getDate() - 7);
            await queryRunner.manager.delete(KlaviyoEventLog, {
                createdAt: LessThan(threshold),
            });

            await queryRunner.commitTransaction();

            return {
                success: true,
                message: 'Event successfully sent to Klaviyo',
                eventName: dto.eventName,
                profile: dto.profileAttributes,
                response: data,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
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
        } finally {
            await queryRunner.release();
        }
    }

    async createBulkEvents(dto: CreateBulkEventDto): Promise<{
        total: number;
        successCount: number;
        failedCount: number;
        results: BulkEventResult[];
    }> {
        const results: BulkEventResult[] = [];

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
            successCount: results.filter(r => r.success).length,
            failedCount: results.filter(r => !r.success).length,
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
                            metric: { name: dto.eventName },
                            profile: dto.profileAttributes,
                            properties: dto.eventAttributes || {},
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
}