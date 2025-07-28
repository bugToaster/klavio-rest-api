import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, ArrayNotEmpty } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

export class CreateBulkEventDto {
    @ApiProperty({ type: [CreateEventDto] })
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateEventDto)
    events: CreateEventDto[];
}
