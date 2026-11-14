import { Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { AIProviderModule } from '../ai-provider/ai-provider.module';

@Module({
  imports: [AIProviderModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
