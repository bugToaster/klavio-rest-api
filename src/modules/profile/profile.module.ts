import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MetricModule } from '../metric/metric.module';

@Module({
    imports: [AnalyticsModule, MetricModule],
    providers: [ProfileService],
    controllers: [ProfileController],
    exports: [ProfileService],
})
export class ProfileModule {}