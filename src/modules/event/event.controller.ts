import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
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
    @ApiResponse({ status: 400, description: 'Validation or Klaviyo error' })
    async createEvent(@Body() dto: CreateEventDto) {
        this.logger.log(`Sending single event: ${dto.eventName}`);
        return this.eventService.createEvent(dto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Send multiple events to Klaviyo in bulk' })
    @ApiResponse({ status: 201, description: 'Bulk events processed' })
    @ApiResponse({ status: 400, description: 'Some events failed' })
    async createBulkEvents(@Body() dto: CreateBulkEventDto) {
        this.logger.log(`Sending ${dto.events.length} events in bulk`);
        return this.eventService.createBulkEvents(dto);
    }

    @Get('metrics')
    @ApiOperation({ summary: 'Fetch all metrics from Klaviyo (auto-paginated)' })
    @ApiResponse({ status: 200, description: 'All Klaviyo metrics retrieved' })
    @ApiResponse({ status: 500, description: 'Failed to fetch metrics' })
    async getAllMetrics() {
        this.logger.log('Fetching all Klaviyo metrics...');
        return this.eventService.getAllMetrics();
    }

}
