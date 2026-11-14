import { Injectable } from '@nestjs/common';
import { APP_NAME, APP_DESCRIPTION } from '@mindvault/shared';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  description: string;
  timestamp: string;
  uptime: number;
}

@Injectable()
export class AppService {
  checkHealth(): HealthCheckResult {
    return {
      status: 'ok',
      service: APP_NAME,
      description: APP_DESCRIPTION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
