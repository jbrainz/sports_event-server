import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventsService } from "./events.service";
import { SportEvent } from "./entity/sport-event.entity";
import { EventStatus } from "./enums/event-status.enum";
import { SportType } from "./enums/sport-type.enum";
import { NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

const idGenerator = () => {
  const id = Math.floor(Math.random() * 1000000);
  return `id-${id}`;
};

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
  count: jest.fn(),
});

const mockCacheManager = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
});

describe("EventsService", () => {
  let service: EventsService;
  let repository: Repository<SportEvent>;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(SportEvent),
          useFactory: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useFactory: mockCacheManager,
        },
        Logger,
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get<Repository<SportEvent>>(
      getRepositoryToken(SportEvent)
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new event and invalidate cache", async () => {
      const createEventDto = {
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.INACTIVE,
        startTime: "2025-05-01T14:00:00Z",
        finishTime: "2025-05-01T16:00:00Z",
      };

      const id = idGenerator();
      const mockEvent = {
        id,
        ...createEventDto,
        startTime: new Date(createEventDto.startTime),
        finishTime: new Date(createEventDto.finishTime),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, "create").mockReturnValue(mockEvent as SportEvent);
      jest.spyOn(repository, "save").mockResolvedValue(mockEvent as SportEvent);
      jest.spyOn(cacheManager, "del").mockResolvedValue(undefined);

      const result = await service.create(createEventDto);

      expect(result).toEqual(mockEvent);
      expect(repository.create).toHaveBeenCalledWith({
        ...createEventDto,
        startTime: expect.any(Date),
        finishTime: expect.any(Date),
      });
      expect(repository.save).toHaveBeenCalledWith(mockEvent);
      expect(cacheManager.del).toHaveBeenCalledWith("events_summary");
    });

    it("should throw an error if start time is after finish time", async () => {
      const createEventDto = {
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.INACTIVE,
        startTime: "2025-05-01T16:00:00Z",
        finishTime: "2025-05-01T14:00:00Z",
      };

      const mockEvent = {
        ...createEventDto,
        startTime: new Date(createEventDto.startTime),
        finishTime: new Date(createEventDto.finishTime),
      };

      jest.spyOn(repository, "create").mockReturnValue(mockEvent as SportEvent);

      await expect(service.create(createEventDto)).rejects.toThrow(
        BadRequestException
      );
      expect(cacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should find an event by id", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.INACTIVE,
        startTime: new Date(),
        finishTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, "findOne")
        .mockResolvedValue(mockEvent as SportEvent);

      const result = await service.findOne(id);
      expect(result).toEqual(mockEvent);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it("should throw NotFoundException if event not found", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValue(null);
      const id = "id-999";

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe("updateStatus", () => {
    it("should update status from inactive to active and invalidate cache", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.INACTIVE,
        startTime: new Date(Date.now() + 86400000), // tomorrow
        finishTime: new Date(Date.now() + 93600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, "findOne")
        .mockResolvedValue(mockEvent as SportEvent);
      jest
        .spyOn(repository, "save")
        .mockImplementation((event) => Promise.resolve(event as SportEvent));
      jest.spyOn(cacheManager, "del").mockResolvedValue(undefined);

      const result = await service.updateStatus(id, {
        status: EventStatus.ACTIVE,
      });

      expect(result.status).toEqual(EventStatus.ACTIVE);
      expect(cacheManager.del).toHaveBeenCalledWith("events_summary");
    });

    it("should throw BadRequestException when activating event with past start time", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.INACTIVE,
        startTime: new Date(Date.now() - 86400000), // yesterday
        finishTime: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, "findOne")
        .mockResolvedValue(mockEvent as SportEvent);

      await expect(
        service.updateStatus(id, { status: EventStatus.ACTIVE })
      ).rejects.toThrow(BadRequestException);

      expect(cacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove an event if not finished and invalidate cache", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.INACTIVE,
        startTime: new Date(),
        finishTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, "findOne")
        .mockResolvedValue(mockEvent as SportEvent);
      jest.spyOn(repository, "remove").mockResolvedValue(undefined);
      jest.spyOn(cacheManager, "del").mockResolvedValue(undefined);

      await service.remove(id);

      expect(repository.remove).toHaveBeenCalledWith(mockEvent);
      expect(cacheManager.del).toHaveBeenCalledWith("events_summary");
    });

    it("should throw BadRequestException when removing finished event", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.FINISHED,
        startTime: new Date(),
        finishTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, "findOne")
        .mockResolvedValue(mockEvent as SportEvent);

      await expect(service.remove(id)).rejects.toThrow(BadRequestException);

      expect(repository.remove).not.toHaveBeenCalled();
      expect(cacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe("getSummary", () => {
    it("should return cached summary if available", async () => {
      const cachedSummary = {
        sportCounts: [
          { sport: SportType.FOOTBALL, count: "5" },
          { sport: SportType.HOCKEY, count: "3" },
        ],
        statusCounts: [
          { status: EventStatus.ACTIVE, count: "2" },
          { status: EventStatus.INACTIVE, count: "4" },
          { status: EventStatus.FINISHED, count: "2" },
        ],
        totalEvents: 8,
      };

      jest.spyOn(cacheManager, "get").mockResolvedValue(cachedSummary);

      const result = await service.getSummary();

      expect(result).toEqual(cachedSummary);
      expect(cacheManager.get).toHaveBeenCalledWith("events_summary");
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("should generate summary and cache it if not available in cache", async () => {
      const mockSportCounts = [
        { sport: SportType.FOOTBALL, count: "5" },
        { sport: SportType.HOCKEY, count: "3" },
      ];

      const mockStatusCounts = [
        { status: EventStatus.ACTIVE, count: "2" },
        { status: EventStatus.INACTIVE, count: "4" },
        { status: EventStatus.FINISHED, count: "2" },
      ];

      const summary = {
        sportCounts: mockSportCounts,
        statusCounts: mockStatusCounts,
        totalEvents: 8,
      };

      jest.spyOn(cacheManager, "get").mockResolvedValue(null);

      const sportQueryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockSportCounts),
      };

      const statusQueryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockStatusCounts),
      };

      jest
        .spyOn(repository, "createQueryBuilder")
        .mockReturnValueOnce(sportQueryBuilderMock as any)
        .mockReturnValueOnce(statusQueryBuilderMock as any);

      jest.spyOn(repository, "count").mockResolvedValue(8);
      jest.spyOn(cacheManager, "set").mockResolvedValue(undefined);

      const result = await service.getSummary();

      expect(result).toEqual(summary);
      expect(cacheManager.get).toHaveBeenCalledWith("events_summary");
      expect(repository.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        "events_summary",
        summary,
        3600
      );
    });
  });
});
