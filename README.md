# Sports Events API

A NestJS-based REST API for managing sports events. This application provides endpoints for creating, reading, updating, and deleting sports events with proper validation and documentation.

## Features

- RESTful API endpoints for sports events management
- PostgreSQL database integration with TypeORM
- Swagger API documentation
- Input validation using class-validator
- Automated event status updates via scheduled jobs
- CORS enabled
- Environment-based configuration
- Database migrations support
- Comprehensive test coverage

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd event-task
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PORT=3000
PRODUCTION=false
```

4. Create DB locally

```
psql -h localhost -U postgres -f .db/init/init.sql
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

## Database Migrations

The project uses TypeORM for database migrations. Here are the available migration commands:

- Generate a new migration:

```bash
npm run typeorm:generate-migration --name=migration_name
```

- Run migrations:

```bash
npm run typeorm:run-migrations
```

- Revert the last migration:

```bash
npm run typeorm:revert-migration
```

## Automated Event Status Updates

The application includes a scheduled job that automatically updates event statuses based on their start and finish times:

- Active events are marked as finished when their finish time has passed
- The scheduler runs every 5 minutes to check for events requiring status updates
- This ensures data consistency without requiring manual intervention

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```
