import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronInitService implements OnApplicationBootstrap {
    private readonly logger = new Logger(CronInitService.name);

    constructor(private readonly configService: ConfigService) {}

    onApplicationBootstrap() {
        const retention = this.configService.get('KLAVIYO_LOG_RETENTION_DAYS');

        if (!retention || isNaN(Number(retention))) {
            this.logger.error('❌ KLAVIYO_LOG_RETENTION_DAYS is not set or invalid');
        } else {
            this.logger.log(`✅ Cron config loaded: KLAVIYO_LOG_RETENTION_DAYS = ${retention} days`);
        }
    }
}
