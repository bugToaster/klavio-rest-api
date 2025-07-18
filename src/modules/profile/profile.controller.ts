import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get('by-email')
    @ApiOperation({ summary: 'Get Klaviyo profile attributes by email' })
    @ApiQuery({ name: 'email', type: String, required: true })
    @ApiResponse({ status: 200, description: 'Profile attributes returned' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    @ApiResponse({ status: 500, description: 'Error fetching profile' })
    getProfileByEmail(@Query('email') email: string) {
        return this.profileService.getProfileByEmail(email);
    }

    @Get('metrics')
    @ApiOperation({ summary: 'Get metric summary for a profile by email' })
    @ApiQuery({ name: 'email', type: String, required: true })
    @ApiResponse({ status: 200, description: 'Metric summary returned' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    @ApiResponse({ status: 500, description: 'Error fetching metrics' })
    getProfileMetrics(@Query('email') email: string) {
        return this.profileService.getProfileMetricsByEmail(email);
    }
}
