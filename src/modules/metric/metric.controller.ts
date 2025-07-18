import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MetricService } from './metric.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricController {
    constructor(private readonly metricService: MetricService) {}

    @Get()
    @ApiOperation({ summary: 'Fetch all Klaviyo metrics' })
    @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
    @ApiResponse({ status: 500, description: 'Failed to fetch metrics' })
    getAllMetrics() {
        return this.metricService.getAllMetrics();
    }

    @Get('counts-by-date')
    @ApiOperation({ summary: 'Get counts and emails for all metrics on a date' })
    @ApiQuery({ name: 'date', type: String, required: true, example: '2025-07-18' })
    @ApiResponse({ status: 200, description: 'Counts returned successfully' })
    @ApiResponse({ status: 500, description: 'Failed to fetch metric counts' })
    getMetricCountsByDateOnly(@Query('date') date: string) {
        return this.metricService.getMetricCountsByDateOnly(date);
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get count & emails for specific metric by date' })
    @ApiQuery({ name: 'metric', type: String, example: 'Product Viewed' })
    @ApiQuery({ name: 'date', type: String, example: '2025-07-18' })
    @ApiResponse({ status: 200, description: 'Metric summary retrieved' })
    @ApiResponse({ status: 404, description: 'Metric not found' })
    @ApiResponse({ status: 500, description: 'Server error' })
    getMetricByNameAndDate(
        @Query('metric') metric: string,
        @Query('date') date: string
    ) {
        return this.metricService.getMetricByNameAndDate(metric, date);
    }
}
