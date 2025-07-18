import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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

    @Get('metrics')
    @ApiOperation({ summary: 'Fetch all Klaviyo metrics' })
    @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
    @ApiResponse({ status: 500, description: 'Failed to fetch metrics' })
    async getAllMetrics() {
        return this.eventService.getAllMetrics();
    }

    @Get('events')
    @ApiOperation({ summary: 'Get events filtered by metric and date range' })
    @ApiQuery({ name: 'metricId', required: false })
    @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
    @ApiResponse({ status: 200, description: 'Events fetched successfully' })
    @ApiResponse({ status: 500, description: 'Error fetching events' })
    async getEvents(
        @Query('metricId') metricId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.eventService.getAllEvents({ metricId, startDate, endDate });
    }

    @Get('metric-counts-by-date')
    @ApiOperation({ summary: 'Get counts and emails for all metrics on a date' })
    @ApiQuery({ name: 'date', type: String, required: true, example: '2025-07-18' })
    @ApiResponse({ status: 200, description: 'Counts returned successfully' })
    @ApiResponse({ status: 500, description: 'Failed to fetch metric counts' })
    async getMetricCountsByDateOnly(@Query('date') date: string) {
        return this.eventService.getMetricCountsByDateOnly(date);
    }

    @Get('metric-summary')
    @ApiOperation({ summary: 'Get count & emails for specific metric by date' })
    @ApiQuery({ name: 'metric', type: String, example: 'Product Viewed' })
    @ApiQuery({ name: 'date', type: String, example: '2025-07-18' })
    @ApiResponse({ status: 200, description: 'Metric summary retrieved' })
    @ApiResponse({ status: 404, description: 'Metric not found' })
    @ApiResponse({ status: 500, description: 'Server error' })
    async getMetricByNameAndDate(
        @Query('metric') metric: string,
        @Query('date') date: string
    ) {
        return this.eventService.getMetricByNameAndDate(metric, date);
    }

    @Get('events-by-email-and-date')
    @ApiOperation({ summary: 'Get all events by user email and date' })
    @ApiQuery({ name: 'email', type: String, required: true })
    @ApiQuery({ name: 'date', type: String, required: true, example: '2025-07-18' })
    @ApiResponse({ status: 200, description: 'Filtered events by email' })
    @ApiResponse({ status: 404, description: 'No events found for email' })
    @ApiResponse({ status: 500, description: 'Server error' })
    async getEventsByEmailAndDate(
        @Query('email') email: string,
        @Query('date') date: string
    ) {
        return this.eventService.getEventsByEmailAndDate(email, date);
    }

    @Get('profile-by-email')
    @ApiOperation({ summary: 'Get Klaviyo profile attributes by email' })
    @ApiQuery({ name: 'email', type: String, required: true })
    @ApiResponse({ status: 200, description: 'Profile attributes returned' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    @ApiResponse({ status: 500, description: 'Error fetching profile' })
    async getProfileByEmail(@Query('email') email: string) {
        return this.eventService.getProfileByEmail(email);
    }


    @Get('profile-metrics')
    @ApiOperation({ summary: 'Get metric summary for a profile by email' })
    @ApiQuery({ name: 'email', type: String, required: true })
    @ApiResponse({ status: 200, description: 'Metric summary returned' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    @ApiResponse({ status: 500, description: 'Error fetching metrics' })
    async getProfileMetrics(@Query('email') email: string) {
        return this.eventService.getProfileMetricsByEmail(email);
    }


}
