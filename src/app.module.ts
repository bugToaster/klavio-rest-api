import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

import { EventModule } from './modules/event/event.module';
import { MetricModule } from './modules/metric/metric.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule, EventModule, MetricModule, ProfileModule, AnalyticsModule],
  exports: [EventModule, MetricModule, ProfileModule, AnalyticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
