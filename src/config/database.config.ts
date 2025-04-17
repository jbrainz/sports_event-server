import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const getDatabaseConfig = (
  configService: ConfigService
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>("PRODUCTION") === "true";

  return {
    type: "postgres",
    url: configService.get<string>("DATABASE_URL"),
    entities: ["dist/**/*.entity{.ts,.js}"],
    synchronize: !isProduction,
    migrations: ["dist/migrations/**/*{.ts,.js}"],
    migrationsTableName: "_migrations",
    migrationsRun: true,
    logging: !isProduction,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  } as TypeOrmModuleOptions;
};
