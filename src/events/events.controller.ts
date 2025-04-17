import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Query,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { UpdateEventStatusDto } from "./dto/update-event-status.dto";
import { EventsFilterDto } from "./dto/events-filter.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new sport event" })
  @ApiResponse({ status: 201, description: "Event successfully created" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: "Get list of sport events with optional filters" })
  @ApiResponse({ status: 200, description: "List of events returned" })
  async findAll(@Query() filters: EventsFilterDto) {
    const [events, total] = await this.eventsService.findAll(filters);
    return {
      events,
      meta: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 10,
        pages: Math.ceil(total / (filters.limit || 10)),
      },
    };
  }

  @Get("summary")
  @ApiOperation({ summary: "Get a summary report of sport events" })
  @ApiResponse({ status: 200, description: "Summary report returned" })
  async getSummary() {
    return this.eventsService.getSummary();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a sport event by id" })
  @ApiParam({ name: "id", description: "Event ID" })
  @ApiResponse({ status: 200, description: "Event details returned" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async findOne(@Param("id") id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a sport event" })
  @ApiParam({ name: "id", description: "Event ID" })
  @ApiResponse({ status: 200, description: "Event updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async update(
    @Param("id") id: string,
    @Body() updateEventDto: UpdateEventDto
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Change sport event status" })
  @ApiParam({ name: "id", description: "Event ID" })
  @ApiResponse({ status: 200, description: "Status updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid status change" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateEventStatusDto
  ) {
    return this.eventsService.updateStatus(id, updateStatusDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove event" })
  @ApiParam({ name: "id", description: "Event ID" })
  @ApiResponse({ status: 204, description: "Event removed successfully" })
  @ApiResponse({ status: 400, description: "Cannot remove finished event" })
  @ApiResponse({ status: 404, description: "Event not found" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    await this.eventsService.remove(id);
  }
}
