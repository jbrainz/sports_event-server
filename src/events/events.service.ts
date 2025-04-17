import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { SportEvent } from "./entity/sport-event.entity";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { UpdateEventStatusDto } from "./dto/update-event-status.dto";
import { EventsFilterDto } from "./dto/events-filter.dto";
import { EventsSummaryDto } from "./dto/events-summary.dto";
import { EventStatus } from "./enums/event-status.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly SUMMARY_CACHE_KEY = "events_summary";
  private readonly SUMMARY_CACHE_TTL = 3600;

  constructor(
    @InjectRepository(SportEvent)
    private eventsRepository: Repository<SportEvent>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(createEventDto: CreateEventDto): Promise<SportEvent> {
    this.logger.log(`Creating new event: ${createEventDto.name}`);

    const startTime = new Date(createEventDto.startTime);
    const finishTime = new Date(createEventDto.finishTime);

    if (isNaN(startTime.getTime()) || isNaN(finishTime.getTime())) {
      throw new BadRequestException("Invalid date format");
    }

    if (startTime >= finishTime) {
      throw new BadRequestException("Start time must be before finish time");
    }

    const event = this.eventsRepository.create({
      ...createEventDto,
      startTime,
      finishTime,
    });

    const result = await this.eventsRepository.save(event);
    await this.invalidateCache();
    return result;
  }

  async findAll(filters: EventsFilterDto): Promise<[SportEvent[], number]> {
    const {
      status,
      sport,
      page = 1,
      limit = 10,
      sortDirection = "ASC",
    } = filters;

    this.logger.debug(
      `Finding events with filters: ${JSON.stringify(filters)}`
    );

    const queryBuilder = this.eventsRepository.createQueryBuilder("event");

    if (status) {
      queryBuilder.andWhere("event.status = :status", { status });
    }

    if (sport) {
      queryBuilder.andWhere("event.sport = :sport", { sport });
    }

    queryBuilder.orderBy("event.startTime", sortDirection);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findOne(id: string): Promise<SportEvent> {
    this.logger.debug(`Finding event with ID: ${id}`);

    const event = await this.eventsRepository.findOne({ where: { id } });

    if (!event) {
      this.logger.warn(`Event with ID ${id} not found`);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto
  ): Promise<SportEvent> {
    this.logger.log(`Updating event with ID: ${id}`);

    const event = await this.findOne(id);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException("Cannot update a finished event");
    }

    if (updateEventDto.status && updateEventDto.status !== event.status) {
      this.validateStatusChange(event, updateEventDto.status);
    }

    let startTime = event.startTime;
    let finishTime = event.finishTime;

    if (updateEventDto.startTime) {
      startTime = new Date(updateEventDto.startTime);
      if (isNaN(startTime.getTime())) {
        throw new BadRequestException("Invalid start time format");
      }
    }

    if (updateEventDto.finishTime) {
      finishTime = new Date(updateEventDto.finishTime);
      if (isNaN(finishTime.getTime())) {
        throw new BadRequestException("Invalid finish time format");
      }
    }

    if (startTime >= finishTime) {
      throw new BadRequestException("Start time must be before finish time");
    }

    const updatedEvent = this.eventsRepository.merge(event, {
      ...updateEventDto,
      startTime,
      finishTime,
    });

    this.logger.debug(`Saving updated event: ${JSON.stringify(updatedEvent)}`);

    const result = await this.eventsRepository.save(updatedEvent);
    await this.invalidateCache();
    return result;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateEventStatusDto
  ): Promise<SportEvent> {
    this.logger.log(
      `Updating status for event with ID: ${id} to ${updateStatusDto.status}`
    );

    const event = await this.findOne(id);
    this.validateStatusChange(event, updateStatusDto.status);

    event.status = updateStatusDto.status;
    const result = await this.eventsRepository.save(event);
    await this.invalidateCache();
    return result;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing event with ID: ${id}`);

    const event = await this.findOne(id);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException("Cannot remove a finished event");
    }

    await this.eventsRepository.remove(event);
    await this.invalidateCache();
  }

  async getSummary(): Promise<EventsSummaryDto> {
    const cachedSummary = await this.cacheManager.get<EventsSummaryDto>(
      this.SUMMARY_CACHE_KEY
    );

    if (cachedSummary) {
      this.logger.debug("Returning cached events summary");
      return cachedSummary;
    }

    this.logger.log("Generating events summary");

    const sportCounts = await this.eventsRepository
      .createQueryBuilder("event")
      .select("event.sport", "sport")
      .addSelect("COUNT(event.id)", "count")
      .groupBy("event.sport")
      .getRawMany();

    const statusCounts = await this.eventsRepository
      .createQueryBuilder("event")
      .select("event.status", "status")
      .addSelect("COUNT(event.id)", "count")
      .groupBy("event.status")
      .getRawMany();

    const totalEvents = await this.eventsRepository.count();

    const summary = {
      sportCounts,
      statusCounts,
      totalEvents,
    };

    // Store in cache
    await this.cacheManager.set(
      this.SUMMARY_CACHE_KEY,
      summary,
      this.SUMMARY_CACHE_TTL
    );

    return summary;
  }

  private validateStatusChange(
    event: SportEvent,
    newStatus: EventStatus
  ): void {
    const now = new Date();

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException("Cannot change status of a finished event");
    }

    if (
      event.status === EventStatus.INACTIVE &&
      newStatus === EventStatus.FINISHED
    ) {
      throw new BadRequestException(
        "Cannot change status from inactive to finished"
      );
    }

    if (newStatus === EventStatus.ACTIVE && event.startTime < now) {
      throw new BadRequestException(
        "Cannot activate an event if start time is in the past"
      );
    }

    if (newStatus === EventStatus.FINISHED && event.startTime > now) {
      throw new BadRequestException(
        "Cannot finish an event if start time is in the future"
      );
    }
  }

  private async invalidateCache(): Promise<void> {
    this.logger.debug("Invalidating events summary cache");
    await this.cacheManager.del(this.SUMMARY_CACHE_KEY);
  }
}
