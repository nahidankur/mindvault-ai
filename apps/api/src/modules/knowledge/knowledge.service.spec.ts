import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { QueueService } from '../queue/queue.service';
import { KnowledgeWorker } from '../queue/knowledge.worker';
import { DRIZZLE } from '../../database/database.constants';

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let mockDb: any;
  let mockQueueService: any;
  let mockKnowledgeWorker: any;

  const mockItem = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    collectionId: null,
    title: 'Test Note',
    sourceType: 'manual_note',
    content: 'This is a test content with words.',
    characterCount: 34,
    wordCount: 7,
    status: 'INDEXING',
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockItem]),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([mockItem]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockItem]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockQueueService = {
      addIngestionJob: jest.fn().mockResolvedValue(undefined),
    };

    mockKnowledgeWorker = {
      processIngestion: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: QueueService, useValue: mockQueueService },
        { provide: KnowledgeWorker, useValue: mockKnowledgeWorker },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  describe('create', () => {
    it('should create an item with word/character count and dispatch to queue', async () => {
      const result = await service.create('user-123', {
        title: 'New Knowledge Note',
        content: 'This is sample markdown text for RAG testing.',
      });

      expect(result).toEqual(mockItem);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockQueueService.addIngestionJob).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: mockItem.id,
          userId: 'user-123',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return item when found', async () => {
      const item = await service.findById('user-123', mockItem.id);
      expect(item).toEqual(mockItem);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      await expect(service.findById('user-123', 'unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete the item and return success true', async () => {
      const result = await service.delete('user-123', mockItem.id);
      expect(result).toEqual({ success: true });
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
