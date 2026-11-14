import { Test, TestingModule } from '@nestjs/testing';
import { ChunkerService } from './chunker.service';

describe('ChunkerService', () => {
  let chunkerService: ChunkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunkerService],
    }).compile();

    chunkerService = module.get<ChunkerService>(ChunkerService);
  });

  describe('normalizeText', () => {
    it('should normalize line breaks and collapse excessive whitespace', () => {
      const dirty = 'Hello\r\nWorld\r\r\n\n\n\nTest\tTab';
      const clean = chunkerService.normalizeText(dirty);
      expect(clean).toBe('Hello\nWorld\n\nTest  Tab');
    });
  });

  describe('splitText', () => {
    it('should return empty array for empty or blank text', () => {
      expect(chunkerService.splitText('')).toEqual([]);
      expect(chunkerService.splitText('   ')).toEqual([]);
    });

    it('should return single chunk for short content under chunk size', () => {
      const text = '# Short Note\n\nThis is a short knowledge snippet.';
      const chunks = chunkerService.splitText(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[0].content).toBe(text);
      expect(chunks[0].metadata.heading).toBe('Short Note');
      expect(chunks[0].metadata.charStart).toBe(0);
    });

    it('should split larger text into multiple overlapping chunks', () => {
      // Create a 5,000 character text
      const paragraph = 'MindVault AI provides personal knowledge retrieval with pgvector. ';
      const longText = paragraph.repeat(80); // ~5,300 chars

      const chunks = chunkerService.splitText(longText, { chunkSize: 200, overlap: 50 });
      expect(chunks.length).toBeGreaterThan(1);

      // Verify sequence of chunk indices
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].chunkIndex).toBe(i);
        expect(chunks[i].content.length).toBeGreaterThan(20);
      }
    });

    it('should preserve markdown section headings in chunk metadata', () => {
      const markdown = `
# Section One
This discusses the primary architecture and requirements.

# Section Two
This covers database indexing with pgvector and full-text search.
      `.trim();

      const chunks = chunkerService.splitText(markdown);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.heading).toBeDefined();
    });
  });
});
