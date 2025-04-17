import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
import { SportEvent } from "src/events/entity/sport-event.entity";

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: "postgres", // or another DB type you're using
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "your_password",
  database: process.env.POSTGRES_DB || "sports_events_db",
  entities: [SportEvent],
  migrations: [__dirname + "/../migrations/**/*.{ts,js}"],
  synchronize: false,
});
