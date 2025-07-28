import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber } from 'class-validator';

export class CreateEventDto {
    @ApiProperty({ example: 'Viewed Product' })
    @IsString()
    eventName: string;

    @ApiProperty({
        example: {
            email: 'sarah@example.com',
            first_name: 'Sarah',
            last_name: 'Connor'
        },
    })
    @IsObject()
    profileAttributes: Record<string, any>;

    @ApiProperty({
        example: {
            Brand: 'Kids Book',
            ProductID: 1111,
            ProductName: 'Winnie the Pooh'
        },
    })
    @IsObject()
    eventAttributes: Record<string, any>;

    @ApiProperty({ example: '2022-11-08T00:00:00+00:00', required: false })
    @IsOptional()
    @IsString()
    timestamp?: string;

    @ApiProperty({ example: 9.99, required: false })
    @IsOptional()
    @IsNumber()
    value?: number;

    @ApiProperty({ example: 'USD', required: false })
    @IsOptional()
    @IsString()
    value_currency?: string;

    @ApiProperty({ example: 'unique-event-id', required: false })
    @IsOptional()
    @IsString()
    uniqueId?: string;
}
