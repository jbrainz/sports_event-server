import { Cron } from "@nestjs/schedule";
import { EventsService } from "./events.service";
import { Injectable, Logger } from "@nestjs/common";
import { LessThan, Repository } from "typeorm";
import { SportEvent } from "./entity/sport-event.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { EventStatus } from "./enums/event-status.enum";

@Injectable()
export class EventsScheduler {
  constructor(
    @InjectRepository(SportEvent)
    private eventsRepository: Repository<SportEvent>,
    private eventsService: EventsService,
    private readonly logger: Logger
  ) {}

  @Cron("0 */5 * * * *") // Every 5 minutes
  async updateEventStatuses() {
    const now = new Date();
    this.logger.log("Checking for events to update...");
    const events = await this.eventsRepository.find({
      where: {
        status: EventStatus.ACTIVE,
        finishTime: LessThan(now),
      },
    });

    for (const event of events) {
      try {
        this.logger.log(`Updating event status for event ID: ${event.id}`);
        await this.eventsService.updateStatus(event.id, {
          status: EventStatus.FINISHED,
        });
      } catch (error) {
        this.logger.error("Error updating event status", error);
      }
    }
  }
}
