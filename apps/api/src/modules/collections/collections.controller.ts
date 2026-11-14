import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserProfile, CollectionSummary } from '@mindvault/shared';
import { Collection } from '@mindvault/database';

@ApiTags('Collections')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all collections of the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of collections with item counts' })
  async findAll(@CurrentUser() user: UserProfile): Promise<CollectionSummary[]> {
    return this.collectionsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific collection by ID' })
  @ApiResponse({ status: 200, description: 'Collection details' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async findOne(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Collection> {
    return this.collectionsService.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  async create(
    @CurrentUser() user: UserProfile,
    @Body() dto: CreateCollectionDto,
  ): Promise<Collection> {
    return this.collectionsService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing collection' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async update(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<Collection> {
    return this.collectionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection (associated notes will be unassigned)' })
  @ApiResponse({ status: 200, description: 'Collection deleted successfully' })
  async delete(
    @CurrentUser() user: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    return this.collectionsService.delete(user.id, id);
  }
}
