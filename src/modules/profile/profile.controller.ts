import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ApiBody } from '@nestjs/swagger';


@ApiTags('Profiles')
@Controller('profiles')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get('all')
    @ApiOperation({ summary: 'Get paginated list of all Klaviyo profiles' })
    @ApiQuery({ name: 'size', required: false, type: Number, description: 'Number of profiles per page' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor from previous request' })
    @ApiResponse({ status: 200, description: 'Paginated list of profiles returned' })
    @ApiResponse({ status: 500, description: 'Error fetching profiles' })
    getAllProfiles(
        @Query('size') size?: number,
        @Query('cursor') cursor?: string
    ) {
        return this.profileService.getAllProfiles({ size, cursor });
    }



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



    @Post('merge')
    @ApiOperation({ summary: 'Merge two Klaviyo profiles' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                primaryProfileId: { type: 'string' },
                duplicateProfileId: { type: 'string' },
            },
            required: ['primaryProfileId', 'duplicateProfileId'],
        },
    })
    @ApiResponse({ status: 200, description: 'Profiles merged successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 500, description: 'Error merging profiles' })
    mergeProfiles(@Body() body: { primaryProfileId: string; duplicateProfileId: string }) {
        const { primaryProfileId, duplicateProfileId } = body;
        return this.profileService.mergeProfiles(primaryProfileId, duplicateProfileId);
    }
}
