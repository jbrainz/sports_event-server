import { IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { EventStatus } from "../enums/event-status.enum";
import { SportType } from "../enums/sport-type.enum";

export class EventsFilterDto {
  @ApiProperty({
    description: "Filter by event status",
    enum: EventStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({
    description: "Filter by sport type",
    enum: SportType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SportType)
  sport?: SportType;

  @ApiProperty({
    description: "Page number for pagination",
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: "Items per page",
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: "Sort direction by start date",
    enum: ["ASC", "DESC"],
    default: "ASC",
    required: false,
  })
  @IsOptional()
  sortDirection?: "ASC" | "DESC" = "ASC";
}
