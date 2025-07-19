import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';
import { EventModule } from './modules/event/event.module';
import { MetricModule } from './modules/metric/metric.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    EventModule,
    MetricModule,
    ProfileModule,
    AnalyticsModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
