import { Module, Global, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabaseClient, DrizzleDatabase } from '@mindvault/database';
import { DRIZZLE } from './database.constants';
import postgres from 'postgres';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const connectionString = configService.get<string>('DATABASE_URL');

        logger.log('Initializing PostgreSQL database connection pool...');
        const { db, client } = createDatabaseClient({ connectionString });

        // Attach client for clean shutdown
        (db as any)._rawClient = client;
        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  async onApplicationShutdown() {
    this.logger.log('Closing database connection pool on shutdown...');
  }
}
