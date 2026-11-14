import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'Research Discussions', default: 'New Conversation' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter queries exclusively to this collection',
  })
  @IsOptional()
  @IsUUID('4')
  collectionId?: string;
}

export class SendMessageDto {
  @ApiProperty({
    example: 'What are the main architectural patterns discussed in my notes?',
    description: 'Natural language question to query against saved knowledge',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question cannot be empty' })
  @MinLength(2)
  @MaxLength(2000)
  question!: string;
}
