import {
  IsNotEmpty,
  IsEnum,
  IsString,
  MinLength,
  ValidateIf,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { EventStatus } from "../enums/event-status.enum";
import { SportType } from "../enums/sport-type.enum";

export class CreateEventDto {
  @ApiProperty({
    description: "Name of the event",
    example: "World Cup Final",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: "Type of sport",
    enum: SportType,
    example: SportType.FOOTBALL,
  })
  @IsEnum(SportType)
  sport: SportType;

  @ApiProperty({
    description: "Status of the event",
    enum: EventStatus,
    default: EventStatus.INACTIVE,
    example: EventStatus.INACTIVE,
  })
  @IsEnum(EventStatus)
  @ValidateIf((o) => o.status !== undefined)
  status?: EventStatus = EventStatus.INACTIVE;

  @ApiProperty({
    description: "Start time of the event",
    example: "2025-05-01T14:00:00Z",
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: "Finish time of the event",
    example: "2025-05-01T16:00:00Z",
  })
  @IsDateString()
  finishTime: string;
}
