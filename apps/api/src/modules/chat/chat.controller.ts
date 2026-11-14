import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService, ChatAnswerResult } from './chat.service';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserProfile, ConversationSummary } from '@mindvault/shared';
import { Conversation } from '@mindvault/database';

@ApiTags('RAG Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat/conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new chat conversation thread' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  async create(
    @CurrentUser() user: UserProfile,
    @Body() dto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.chatService.createConversation(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all conversation threads of the user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async list(@CurrentUser() user: UserProfile): Promise<ConversationSummary[]> {
    return this.chatService.listConversations(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation history and messages with citations' })
  @ApiResponse({ status: 200, description: 'Conversation details with messages' })
  async getOne(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ conversation: Conversation; messages: any[] }> {
    return this.chatService.getConversation(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation thread' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  async delete(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    return this.chatService.deleteConversation(user.id, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Ask a question (returns full grounded answer with citations in JSON)' })
  @ApiResponse({ status: 201, description: 'Grounded answer with citations' })
  async sendMessage(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<ChatAnswerResult> {
    return this.chatService.sendMessage(user.id, id, dto);
  }

  @Post(':id/messages/stream')
  @ApiOperation({ summary: 'Ask a question with Server-Sent Events (SSE) real-time streaming' })
  async streamMessage(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      await this.chatService.streamMessage(user.id, id, dto, (chunk) => {
        res.write(`data: ${chunk}\n\n`);
      });
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err?.message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
