import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Artificial Intelligence', description: 'Collection title' })
  @IsString()
  @IsNotEmpty({ message: 'Collection name is required' })
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Notes and papers about LLMs and RAG', description: 'Collection description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '#6366f1', description: 'Hex color code for UI badge' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Color must be a valid hex color code (e.g. #6366f1)',
  })
  colorHex?: string;
}

export class UpdateCollectionDto {
  @ApiPropertyOptional({ example: 'Updated Collection Title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Color must be a valid hex color code (e.g. #10b981)',
  })
  colorHex?: string;
}
