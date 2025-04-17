import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventsModule } from "./events/events.module";
import { ScheduleModule } from "@nestjs/schedule";
import { getDatabaseConfig } from "./config/database.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    EventsModule,
    ScheduleModule.forRoot(),
    EventsModule,
  ],
})
export class AppModule {}
