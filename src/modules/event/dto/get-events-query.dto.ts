import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetEventsQueryDto {
    @ApiPropertyOptional({ example: 'Product Viewed', description: 'Filter by metric name' })
    @IsOptional()
    @IsString()
    metricName?: string;

    @ApiPropertyOptional({ example: 'xyz123', description: 'Cursor for pagination' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ example: 25, description: 'Number of events per page (max 100)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize?: number;
}
