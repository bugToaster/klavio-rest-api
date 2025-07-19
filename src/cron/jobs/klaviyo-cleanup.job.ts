import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { KlaviyoEventLog } from '@/modules/event/entities/klaviyo-event-log.entity';

@Injectable()
export class KlaviyoCleanupJob {
    private readonly logger = new Logger(KlaviyoCleanupJob.name);
    private readonly retentionDays: number;

    constructor(
        @InjectRepository(KlaviyoEventLog)
        private readonly eventLogRepo: Repository<KlaviyoEventLog>,
        private readonly configService: ConfigService,
    ) {
        this.retentionDays = parseInt(this.configService.get('KLAVIYO_LOG_RETENTION_DAYS') || '7', 10);
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handleCleanup() {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - this.retentionDays);

        const result = await this.eventLogRepo.delete({ createdAt: LessThan(threshold) });
        this.logger.log(`🧹 Deleted ${result.affected} Klaviyo logs older than ${this.retentionDays} days`);
    }
}
