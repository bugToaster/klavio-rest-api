import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';

export class CreateBulkEventDto {
    @ApiProperty({ type: [CreateEventDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateEventDto)
    events: CreateEventDto[];
}
