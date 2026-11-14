import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto, UpdateKnowledgeDto, QueryKnowledgeDto } from './dto/knowledge.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserProfile, PaginatedResponse } from '@mindvault/shared';
import { KnowledgeItem } from '@mindvault/database';

@ApiTags('Knowledge')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  @ApiOperation({ summary: 'List and search knowledge items with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of knowledge items' })
  async findAll(
    @CurrentUser() user: UserProfile,
    @Query() query: QueryKnowledgeDto,
  ): Promise<PaginatedResponse<KnowledgeItem>> {
    return this.knowledgeService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single knowledge item by ID' })
  @ApiResponse({ status: 200, description: 'Knowledge item details' })
  @ApiResponse({ status: 404, description: 'Knowledge item not found' })
  async findOne(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<KnowledgeItem> {
    return this.knowledgeService.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and asynchronously ingest a new note or article' })
  @ApiResponse({ status: 201, description: 'Knowledge item created and queued for indexing' })
  async create(
    @CurrentUser() user: UserProfile,
    @Body() dto: CreateKnowledgeDto,
  ): Promise<KnowledgeItem> {
    return this.knowledgeService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing knowledge item and re-index' })
  @ApiResponse({ status: 200, description: 'Knowledge item updated successfully' })
  @ApiResponse({ status: 404, description: 'Knowledge item not found' })
  async update(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKnowledgeDto,
  ): Promise<KnowledgeItem> {
    return this.knowledgeService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a knowledge item and its vector embeddings' })
  @ApiResponse({ status: 200, description: 'Knowledge item deleted successfully' })
  async delete(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    return this.knowledgeService.delete(user.id, id);
  }

  @Post(':id/reindex')
  @ApiOperation({ summary: 'Manually re-trigger chunking and embedding generation' })
  @ApiResponse({ status: 200, description: 'Reindexing triggered successfully' })
  async reindex(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<KnowledgeItem> {
    return this.knowledgeService.reindex(user.id, id);
  }
}
