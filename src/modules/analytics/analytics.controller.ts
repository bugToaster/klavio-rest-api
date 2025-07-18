import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('events')
    @ApiOperation({ summary: 'Get events filtered by metric and date range' })
    @ApiQuery({ name: 'metricId', required: false })
    @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
    @ApiResponse({ status: 200, description: 'Events fetched successfully' })
    @ApiResponse({ status: 500, description: 'Error fetching events' })
    getEvents(
        @Query('metricId') metricId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.analyticsService.getAllEvents({ metricId, startDate, endDate });
    }

    @Get('events-by-email-date')
    @ApiOperation({ summary: 'Get all events by user email and date' })
    @ApiQuery({ name: 'email', type: String, required: true })
    @ApiQuery({ name: 'date', type: String, required: true, example: '2025-07-18' })
    @ApiResponse({ status: 200, description: 'Filtered events by email' })
    @ApiResponse({ status: 404, description: 'No events found for email' })
    @ApiResponse({ status: 500, description: 'Server error' })
    getEventsByEmailAndDate(
        @Query('email') email: string,
        @Query('date') date: string
    ) {
        return this.analyticsService.getEventsByEmailAndDate(email, date);
    }
}
