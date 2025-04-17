import { Test, TestingModule } from "@nestjs/testing";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { SportType } from "./enums/sport-type.enum";
import { EventStatus } from "./enums/event-status.enum";
import { NotFoundException, BadRequestException } from "@nestjs/common";

const idGenerator = () => {
  const id = Math.floor(Math.random() * 1000000);
  return `id-${id}`;
};
describe("EventsController", () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    getSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new event", async () => {
      const dto = {
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.INACTIVE,
        startTime: "2025-05-01T14:00:00Z",
        finishTime: "2025-05-01T16:00:00Z",
      };

      const mockEvent = {
        id: idGenerator(),
        ...dto,
        startTime: new Date(dto.startTime),
        finishTime: new Date(dto.finishTime),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, "create").mockResolvedValue(mockEvent as any);

      expect(await controller.create(dto)).toBe(mockEvent);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("findAll", () => {
    it("should return events with metadata", async () => {
      const mockEvents = [
        {
          id: idGenerator(),
          name: "Test Event 1",
          sport: SportType.FOOTBALL,
          status: EventStatus.ACTIVE,
        },
        {
          id: idGenerator(),
          name: "Test Event 2",
          sport: SportType.HOCKEY,
          status: EventStatus.INACTIVE,
        },
      ];

      const filters = { page: 1, limit: 10 };

      jest.spyOn(service, "findAll").mockResolvedValue([mockEvents as any, 2]);

      const result = await controller.findAll(filters);

      expect(result).toEqual({
        events: mockEvents,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });

      expect(service.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe("findOne", () => {
    it("should return a single event", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.ACTIVE,
      };

      jest.spyOn(service, "findOne").mockResolvedValue(mockEvent as any);

      expect(await controller.findOne(id)).toBe(mockEvent);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });

    it("should pass through NotFoundException", async () => {
      jest.spyOn(service, "findOne").mockRejectedValue(new NotFoundException());

      await expect(controller.findOne("999")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("updateStatus", () => {
    it("should update event status", async () => {
      const id = idGenerator();
      const mockEvent = {
        id,
        name: "Test Event",
        sport: SportType.FOOTBALL,
        status: EventStatus.ACTIVE,
      };

      const updateStatusDto = { status: EventStatus.FINISHED };

      jest.spyOn(service, "updateStatus").mockResolvedValue(mockEvent as any);

      expect(await controller.updateStatus(id, updateStatusDto)).toBe(
        mockEvent
      );
      expect(service.updateStatus).toHaveBeenCalledWith(id, updateStatusDto);
    });
  });

  describe("remove", () => {
    it("should remove an event", async () => {
      jest.spyOn(service, "remove").mockResolvedValue(undefined);
      const id = idGenerator();
      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe("getSummary", () => {
    it("should return event summary", async () => {
      const mockSummary = {
        sportCounts: [
          { sport: SportType.FOOTBALL, count: "5" },
          { sport: SportType.HOCKEY, count: "3" },
        ],
        statusCounts: [
          { status: EventStatus.ACTIVE, count: "2" },
          { status: EventStatus.INACTIVE, count: "4" },
        ],
        totalEvents: 8,
      };

      jest.spyOn(service, "getSummary").mockResolvedValue(mockSummary as any);

      expect(await controller.getSummary()).toBe(mockSummary);
    });
  });
});
