import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ChunkerModule } from './modules/chunker/chunker.module';
import { AIProviderModule } from './modules/ai-provider/ai-provider.module';
import { QueueModule } from './modules/queue/queue.module';
import { RetrievalModule } from './modules/retrieval/retrieval.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CollectionsModule,
    KnowledgeModule,
    ChunkerModule,
    AIProviderModule,
    QueueModule,
    RetrievalModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
