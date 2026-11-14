import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { KnowledgeSourceType, KNOWLEDGE_LIMITS } from '@mindvault/shared';

export class CreateKnowledgeDto {
  @ApiProperty({ example: 'Next.js 16 App Router Insights', description: 'Title of the note or article' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(KNOWLEDGE_LIMITS.TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({
    example: '# Next.js 16 Features\n\nTurbopack is now enabled by default...',
    description: 'Raw markdown or plain text content',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(KNOWLEDGE_LIMITS.MIN_CONTENT_LENGTH, {
    message: `Content must be at least ${KNOWLEDGE_LIMITS.MIN_CONTENT_LENGTH} characters`,
  })
  @MaxLength(KNOWLEDGE_LIMITS.MAX_CONTENT_LENGTH, {
    message: `Content exceeds the maximum allowed length of ${KNOWLEDGE_LIMITS.MAX_CONTENT_LENGTH} characters`,
  })
  content!: string;

  @ApiPropertyOptional({
    example: 'manual_note',
    enum: ['manual_note', 'pasted_article', 'research_doc'],
    default: 'manual_note',
  })
  @IsOptional()
  @IsEnum(['manual_note', 'pasted_article', 'research_doc'])
  sourceType?: KnowledgeSourceType = 'manual_note';

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Optional collection ID to organize this item',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Collection ID must be a valid UUID' })
  collectionId?: string;
}

export class UpdateKnowledgeDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsOptional()
  @IsString()
  @MaxLength(KNOWLEDGE_LIMITS.TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated Markdown Content...' })
  @IsOptional()
  @IsString()
  @MinLength(KNOWLEDGE_LIMITS.MIN_CONTENT_LENGTH)
  @MaxLength(KNOWLEDGE_LIMITS.MAX_CONTENT_LENGTH)
  content?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID('4')
  collectionId?: string | null;
}

export class QueryKnowledgeDto {
  @ApiPropertyOptional({ description: 'Filter by collection ID' })
  @IsOptional()
  @IsUUID('4')
  collectionId?: string;

  @ApiPropertyOptional({ description: 'Search title and content with keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['DRAFT', 'INDEXING', 'READY', 'FAILED'],
    description: 'Filter by indexing status',
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'INDEXING', 'READY', 'FAILED'])
  status?: 'DRAFT' | 'INDEXING' | 'READY' | 'FAILED';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  pageSize?: number = 20;
}
