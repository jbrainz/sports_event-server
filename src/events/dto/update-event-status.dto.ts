import { IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { EventStatus } from "../enums/event-status.enum";

export class UpdateEventStatusDto {
  @ApiProperty({
    description: "New status for the event",
    enum: EventStatus,
    example: EventStatus.ACTIVE,
  })
  @IsEnum(EventStatus)
  @IsNotEmpty()
  status: EventStatus;
}
