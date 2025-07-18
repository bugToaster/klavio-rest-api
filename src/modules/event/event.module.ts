import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KlaviyoEventLog } from './entities/klaviyo-event-log.entity';

@Module({
    controllers: [EventController],
    providers: [EventService],
    imports: [TypeOrmModule.forFeature([KlaviyoEventLog])],

})
export class EventModule {}
