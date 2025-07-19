import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KlaviyoEventLog } from '@/modules/event/entities/klaviyo-event-log.entity';
import { KlaviyoCleanupJob } from './jobs/klaviyo-cleanup.job';
import { CronInitService } from './cron-init.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([KlaviyoEventLog]),
    ],
    providers: [KlaviyoCleanupJob, CronInitService],
})
export class CronModule {}
