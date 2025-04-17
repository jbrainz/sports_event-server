import { PartialType } from "@nestjs/mapped-types";
import { CreateEventDto } from "./create-event.dto";
import { IsOptional, IsEnum } from "class-validator";
import { EventStatus } from "../enums/event-status.enum";

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
