import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateBulkEventDto } from './dto/create-bulk-event.dto';

@ApiTags('Events')
@Controller('events')
export class EventController {
    private readonly logger = new Logger(EventController.name);

    constructor(private readonly eventService: EventService) {}

    @Post()
    @ApiOperation({ summary: 'Send a single event to Klaviyo' })
    @ApiResponse({ status: 201, description: 'Event sent successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input or API error' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async createEvent(@Body() dto: CreateEventDto) {
        this.logger.log(`Sending event: ${dto.eventName}`);
        return this.eventService.createEvent(dto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Send multiple events in bulk' })
    @ApiResponse({ status: 201, description: 'Bulk events sent' })
    @ApiResponse({ status: 400, description: 'Validation failure in one or more events' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async createBulkEvents(@Body() dto: CreateBulkEventDto) {
        this.logger.log(`Sending ${dto.events.length} bulk events`);
        return this.eventService.createBulkEvents(dto);
    }
}
