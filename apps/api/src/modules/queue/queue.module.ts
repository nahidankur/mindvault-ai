import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { KnowledgeWorker } from './knowledge.worker';
import { ChunkerModule } from '../chunker/chunker.module';
import { AIProviderModule } from '../ai-provider/ai-provider.module';

@Global()
@Module({
  imports: [ChunkerModule, AIProviderModule],
  providers: [QueueService, KnowledgeWorker],
  exports: [QueueService, KnowledgeWorker],
})
export class QueueModule {}
