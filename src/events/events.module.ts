import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventsService } from "./events.service";
import { EventsController } from "./events.controller";
import { SportEvent } from "./entity/sport-event.entity";
import { EventsScheduler } from "./events.scheduler";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    TypeOrmModule.forFeature([SportEvent]),
    CacheModule.register({
      ttl: 3600,
      max: 100,
    }),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsScheduler, Logger],
  exports: [EventsService],
})
export class EventsModule {}
