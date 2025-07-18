import { Module } from '@nestjs/common';
import { MetricService } from './metric.service';
import { MetricController } from './metric.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
    imports: [AnalyticsModule],
    providers: [MetricService],
    controllers: [MetricController],
    exports: [MetricService],
})
export class MetricModule {}
