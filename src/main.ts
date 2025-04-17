import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  app.setGlobalPrefix("api");

  const corsOrigins = configService.get<string>(
    "CORS_ORIGINS",
    "http://localhost:4200"
  );
  app.enableCors({
    origin: corsOrigins.split(","),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle("Sports Events API")
    .setDescription("API for managing sports events")
    .setVersion("1.0")
    .addTag("events")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get<number>("PORT", 3000);
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error("Error during application bootstrap:", err);
  process.exit(1);
});
