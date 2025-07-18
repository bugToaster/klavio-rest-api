import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject } from 'class-validator';

export class CreateEventDto {
    @ApiProperty({ example: 'Product Viewed' })
    @IsString()
    eventName: string;

    @ApiProperty({ example: { item_id: '123', price: 45.0 } })
    @IsObject()
    eventAttributes: Record<string, any>;

    @ApiProperty({ example: { email: 'user@example.com', first_name: 'John' } })
    @IsObject()
    profileAttributes: Record<string, any>;
}
