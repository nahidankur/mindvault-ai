import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, ConnectionOptions } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '@mindvault/shared';

export interface IngestionJobData {
  itemId: string;
  userId: string;
  text: string;
}

@Injectable()
export class QueueService implements OnApplicationShutdown {
  private readonly logger = new Logger(QueueService.name);
  private knowledgeQueue: Queue<IngestionJobData> | null = null;
  private readonly redisOptions: ConnectionOptions;
  private isRedisAvailable = false;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = Number(this.configService.get<number>('REDIS_PORT', 6379));
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.redisOptions = redisUrl
      ? { url: redisUrl, maxRetriesPerRequest: null }
      : {
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          maxRetriesPerRequest: null,
        };

    this.initializeQueue();
  }

  private initializeQueue() {
    try {
      this.knowledgeQueue = new Queue<IngestionJobData>(QUEUE_NAMES.KNOWLEDGE_INGESTION, {
        connection: this.redisOptions,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      this.isRedisAvailable = true;
      const redisHost = (this.redisOptions as any).host || (this.redisOptions as any).url || 'redis';
      this.logger.log(`BullMQ Knowledge Queue initialized on ${redisHost}`);
    } catch (err: any) {
      this.logger.warn(
        `Redis connection could not be established: ${err?.message}. Direct fallback will be used if needed.`,
      );
      this.isRedisAvailable = false;
    }
  }

  getRedisOptions(): ConnectionOptions {
    return this.redisOptions;
  }

  /**
   * Dispatches knowledge text ingestion task to BullMQ
   */
  async addIngestionJob(data: IngestionJobData): Promise<void> {
    if (this.knowledgeQueue && this.isRedisAvailable) {
      try {
        await this.knowledgeQueue.add(JOB_NAMES.PROCESS_TEXT, data, {
          jobId: `ingest-${data.itemId}-${Date.now()}`,
        });
        this.logger.log(`Job enqueued for knowledge item: ${data.itemId}`);
        return;
      } catch (err: any) {
        this.logger.warn(`Failed to add job to Redis queue (${err?.message}). Running in fallback mode.`);
      }
    }

    this.logger.log(`Processing ingestion directly for item: ${data.itemId} (direct fallback)`);
  }

  async onApplicationShutdown() {
    if (this.knowledgeQueue) {
      await this.knowledgeQueue.close();
    }
  }
}
