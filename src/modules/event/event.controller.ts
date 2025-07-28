import { Controller, Get, Post, Query, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateBulkEventDto } from './dto/create-bulk-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';

@ApiTags('Events')
@Controller('events')
export class EventController {
    private readonly logger = new Logger(EventController.name);

    constructor(private readonly eventService: EventService) {}

    @Get()
    @ApiOperation({ summary: 'Get events from Klaviyo (supports cursor & size)' })
    getEvents(@Query() query: GetEventsQueryDto) {
        return this.eventService.getEvents(query);
    }

    @Post()
    @ApiOperation({ summary: 'Send a single event to Klaviyo' })
    @ApiResponse({ status: 201, description: 'Event sent successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input or API error' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async createEvent(@Body() dto: CreateEventDto) {
        this.logger.log(`Sending event: ${dto.eventName}`);
        return this.eventService.sendEvents(dto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Send multiple events in bulk' })
    @ApiResponse({ status: 201, description: 'Bulk events sent' })
    @ApiResponse({ status: 400, description: 'Validation failure in one or more events' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async createBulkEvents(@Body() dto: CreateBulkEventDto) {
        this.logger.log(`Sending ${dto.events.length} bulk events`);
        return this.eventService.sendEvents(dto.events);
    }
}
