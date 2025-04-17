import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { EventsScheduler } from "./events.scheduler";
import { EventsService } from "./events.service";
import { SportEvent } from "./entity/sport-event.entity";
import { EventStatus } from "./enums/event-status.enum";
import { Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

const idGenerator = () => {
  const id = Math.floor(Math.random() * 1000000);
  return `id-${id}`;
};

describe("EventsScheduler", () => {
  let scheduler: EventsScheduler;
  let repository: Repository<SportEvent>;
  let eventsService: EventsService;
  let logger: Logger;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsScheduler,
        {
          provide: getRepositoryToken(SportEvent),
          useFactory: () => ({
            find: jest.fn(),
          }),
        },
        {
          provide: EventsService,
          useFactory: () => ({
            updateStatus: jest.fn(),
          }),
        },
        {
          provide: Logger,
          useFactory: () => ({
            log: jest.fn(),
            error: jest.fn(),
          }),
        },
        {
          provide: CACHE_MANAGER,
          useFactory: () => ({
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          }),
        },
      ],
    }).compile();

    scheduler = module.get<EventsScheduler>(EventsScheduler);
    repository = module.get<Repository<SportEvent>>(
      getRepositoryToken(SportEvent)
    );
    eventsService = module.get<EventsService>(EventsService);
    logger = module.get<Logger>(Logger);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it("should be defined", () => {
    expect(scheduler).toBeDefined();
  });

  describe("updateEventStatuses", () => {
    it("should update status of active events with finish time in the past", async () => {
      const id1 = idGenerator();
      const id2 = idGenerator();
      const mockEvents = [
        {
          id: id1,
          name: "Past Event 1",
          status: EventStatus.ACTIVE,
          startTime: new Date("2025-04-16T10:00:00Z"),
          finishTime: new Date("2025-04-16T11:00:00Z"),
        },
        {
          id: id2,
          name: "Past Event 2",
          status: EventStatus.ACTIVE,
          startTime: new Date("2025-04-16T09:00:00Z"),
          finishTime: new Date("2025-04-16T11:30:00Z"),
        },
      ];

      jest
        .spyOn(repository, "find")
        .mockResolvedValue(mockEvents as SportEvent[]);
      jest
        .spyOn(eventsService, "updateStatus")
        .mockResolvedValue({} as SportEvent);
      jest.spyOn(logger, "log").mockImplementation();

      await scheduler.updateEventStatuses();

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          status: EventStatus.ACTIVE,
          finishTime: LessThan(expect.any(Date)),
        },
      });

      expect(eventsService.updateStatus).toHaveBeenCalledTimes(2);
      expect(eventsService.updateStatus).toHaveBeenCalledWith(id1, {
        status: EventStatus.FINISHED,
      });
      expect(eventsService.updateStatus).toHaveBeenCalledWith(id2, {
        status: EventStatus.FINISHED,
      });

      expect(logger.log).toHaveBeenCalledWith(
        "Checking for events to update..."
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Updating event status for event ID: ${id1}`
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Updating event status for event ID: ${id2}`
      );
    });

    it("should not update any events if no finished events found", async () => {
      jest.spyOn(repository, "find").mockResolvedValue([]);
      jest.spyOn(eventsService, "updateStatus");
      jest.spyOn(logger, "log").mockImplementation();

      await scheduler.updateEventStatuses();

      expect(repository.find).toHaveBeenCalled();
      expect(eventsService.updateStatus).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        "Checking for events to update..."
      );
    });

    it("should handle errors during event updates", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Problem Event",
        status: EventStatus.ACTIVE,
        startTime: new Date("2025-04-16T10:00:00Z"),
        finishTime: new Date("2025-04-16T11:00:00Z"),
      };

      jest
        .spyOn(repository, "find")
        .mockResolvedValue([mockEvent as SportEvent]);
      jest
        .spyOn(eventsService, "updateStatus")
        .mockRejectedValue(new Error("Service error"));
      jest.spyOn(logger, "log").mockImplementation();
      jest.spyOn(logger, "error").mockImplementation();
      jest.spyOn(cacheManager, "del").mockResolvedValue(undefined);

      await expect(scheduler.updateEventStatuses()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        "Error updating event status",
        expect.any(Error)
      );
    });
  });
});
