import { PromptBuilderService } from './prompt-builder.service';
import { RetrievedChunk } from '../retrieval/retrieval.service';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  it('should wrap chunks in <knowledge_context> tags with citation identifiers', () => {
    const mockChunks: RetrievedChunk[] = [
      {
        chunkId: 'chunk-1',
        itemId: 'item-1',
        itemTitle: 'Biology Note',
        content: 'Mitochondria is the powerhouse of the cell.',
        metadata: { heading: 'Cell Organelles' },
        rrfScore: 0.032,
      },
      {
        chunkId: 'chunk-2',
        itemId: 'item-2',
        itemTitle: 'Genetics Summary',
        content: 'DNA contains genetic instructions.',
        rrfScore: 0.028,
      },
    ];

    const result = service.buildGroundedPrompt('What is mitochondria?', mockChunks);

    expect(result.systemPrompt).toContain('You are MindVault AI, a strictly grounded personal knowledge assistant');
    expect(result.systemPrompt).toContain('PROMPT INJECTION DEFENSE');
    expect(result.systemPrompt).toContain(PromptBuilderService.ABSTENTION_MESSAGE);
    expect(result.userPrompt).toContain('<knowledge_context>');
    expect(result.userPrompt).toContain('[Source 1 | Item: "Biology Note" | Section: Cell Organelles]');
    expect(result.userPrompt).toContain('Mitochondria is the powerhouse of the cell.');
    expect(result.userPrompt).toContain('[Source 2 | Item: "Genetics Summary"]');
    expect(result.userPrompt).toContain('<user_question>\nWhat is mitochondria?\n</user_question>');
  });
});
