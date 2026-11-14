import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PromptBuilderService } from './prompt-builder.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { AIProviderModule } from '../ai-provider/ai-provider.module';

@Module({
  imports: [RetrievalModule, AIProviderModule],
  controllers: [ChatController],
  providers: [ChatService, PromptBuilderService],
  exports: [ChatService, PromptBuilderService],
})
export class ChatModule {}
