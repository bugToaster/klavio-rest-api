import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { KlaviyoEventLog } from './entities/klaviyo-event-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([KlaviyoEventLog])],
    providers: [EventService],
    controllers: [EventController],
    exports: [EventService],
})
export class EventModule {}