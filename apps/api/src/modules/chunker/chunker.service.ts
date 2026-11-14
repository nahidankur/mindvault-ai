import { Injectable, Logger } from '@nestjs/common';
import { RAG_CONFIG } from '@mindvault/shared';

export interface TextChunk {
  chunkIndex: number;
  content: string;
  metadata: {
    heading?: string;
    charStart: number;
    charEnd: number;
    tokenEstimate: number;
  };
}

export interface ChunkerOptions {
  chunkSize?: number; // Approximate token count (1 token ~= 4 chars)
  overlap?: number;
}

@Injectable()
export class ChunkerService {
  private readonly logger = new Logger(ChunkerService.name);

  /**
   * Cleans and normalizes markdown and raw text
   */
  normalizeText(input: string): string {
    return input
      .replace(/\r\n/g, '\n') // Normalize Windows line breaks
      .replace(/\r/g, '\n') // Normalize legacy Mac line breaks
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
      .replace(/\t/g, '  ') // Replace tabs with 2 spaces
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive blank lines
      .trim();
  }

  /**
   * Recursively splits text into semantic chunks respecting headings, paragraphs, and sentence boundaries
   */
  splitText(rawText: string, options: ChunkerOptions = {}): TextChunk[] {
    const text = this.normalizeText(rawText);
    if (!text) return [];

    const targetTokens = options.chunkSize || RAG_CONFIG.CHUNK_SIZE_TOKENS; // ~600 tokens
    const targetChars = targetTokens * 4; // ~2400 chars
    const overlapChars = (options.overlap || RAG_CONFIG.CHUNK_OVERLAP_TOKENS) * 4; // ~400 chars

    // If total text is smaller than target chunk size, return single chunk
    if (text.length <= targetChars) {
      return [
        {
          chunkIndex: 0,
          content: text,
          metadata: {
            heading: this.findFirstHeading(text),
            charStart: 0,
            charEnd: text.length,
            tokenEstimate: Math.ceil(text.length / 4),
          },
        },
      ];
    }

    const chunks: TextChunk[] = [];
    const sections = this.splitIntoSectionsByHeading(text);
    let chunkIndex = 0;

    for (const section of sections) {
      const sectionChunks = this.splitSection(
        section.content,
        section.heading,
        section.globalOffset,
        targetChars,
        overlapChars,
      );

      for (const sc of sectionChunks) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: sc.content,
          metadata: sc.metadata,
        });
      }
    }

    return chunks;
  }

  private splitIntoSectionsByHeading(
    text: string,
  ): Array<{ heading?: string; content: string; globalOffset: number }> {
    const lines = text.split('\n');
    const sections: Array<{ heading?: string; content: string; globalOffset: number }> = [];

    let currentHeading: string | undefined = undefined;
    let currentLines: string[] = [];
    let sectionStartOffset = 0;
    let currentOffset = 0;

    for (const line of lines) {
      const isHeading = /^#{1,4}\s+(.+)$/.test(line.trim());
      if (isHeading && currentLines.length > 0) {
        // Push accumulated section
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n'),
          globalOffset: sectionStartOffset,
        });
        currentLines = [];
        sectionStartOffset = currentOffset;
      }

      if (isHeading) {
        const match = line.trim().match(/^#{1,4}\s+(.+)$/);
        currentHeading = match ? match[1] : undefined;
      }

      currentLines.push(line);
      currentOffset += line.length + 1; // +1 for \n
    }

    if (currentLines.length > 0) {
      sections.push({
        heading: currentHeading,
        content: currentLines.join('\n'),
        globalOffset: sectionStartOffset,
      });
    }

    return sections;
  }

  private splitSection(
    sectionContent: string,
    heading: string | undefined,
    baseOffset: number,
    targetChars: number,
    overlapChars: number,
  ): Array<{ content: string; metadata: TextChunk['metadata'] }> {
    const result: Array<{ content: string; metadata: TextChunk['metadata'] }> = [];
    let start = 0;

    while (start < sectionContent.length) {
      let end = start + targetChars;

      if (end >= sectionContent.length) {
        end = sectionContent.length;
      } else {
        // Find natural sentence or paragraph break
        const searchSubstr = sectionContent.substring(start + targetChars / 2, end + 200);
        const naturalBreak = this.findNaturalBreak(searchSubstr);
        if (naturalBreak !== -1) {
          end = start + targetChars / 2 + naturalBreak;
        }
      }

      const rawChunk = sectionContent.substring(start, end).trim();
      if (rawChunk.length > 20) {
        // Prepend heading context if available for richer semantic representation
        const enrichedContent = heading && !rawChunk.startsWith('#')
          ? `[Section: ${heading}]\n${rawChunk}`
          : rawChunk;

        result.push({
          content: enrichedContent,
          metadata: {
            heading,
            charStart: baseOffset + start,
            charEnd: baseOffset + end,
            tokenEstimate: Math.ceil(enrichedContent.length / 4),
          },
        });
      }

      if (end >= sectionContent.length) {
        break;
      }

      // Advance with overlap
      start = Math.max(start + 1, end - overlapChars);
    }

    return result;
  }

  private findNaturalBreak(text: string): number {
    // Priority: Double newline > Single newline > Period + space > Comma + space
    const doubleNewline = text.lastIndexOf('\n\n');
    if (doubleNewline !== -1) return doubleNewline + 2;

    const singleNewline = text.lastIndexOf('\n');
    if (singleNewline !== -1) return singleNewline + 1;

    const sentenceEnd = text.lastIndexOf('. ');
    if (sentenceEnd !== -1) return sentenceEnd + 2;

    return -1;
  }

  private findFirstHeading(text: string): string | undefined {
    const match = text.match(/^#{1,4}\s+(.+)$/m);
    return match ? match[1].trim() : undefined;
  }
}
