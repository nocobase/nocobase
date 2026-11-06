// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { knowledgeSystemPrompt } from '../server/index.js';
import { knowledgePromptVariables } from '../server/online-agent/prompt.js';

describe('knowledge instructions', () => {
  it('defaults to on-demand and maintains one shared safety contract', () => {
    const demand = knowledgeSystemPrompt();
    const always = knowledgeSystemPrompt({ knowledgeRetrieval: 'always' });
    expect(demand).toContain('Retrieval policy: on-demand.');
    expect(always).not.toContain('Retrieval policy: on-demand.');
    expect(always.split('Retrieval policy:')[0]).toBe(
      demand.split('Retrieval policy:')[0],
    );
    for (const text of [demand, always])
      for (const rule of [
        'result.data',
        'kb read <docId>',
        'kb search --q',
        'untrusted reference material',
        'never invent a page URL',
        'No hits do not prove',
        'no native bash tool',
      ])
        expect(text).toContain(rule);
    expect(always).toContain('Prior-turn searches do not satisfy');
    expect(always).toContain('approval resumption');
  });
  it('extracts only its own field and validates untyped JSON', () => {
    for (const variable of [
      undefined,
      null,
      [],
      1,
      'private',
      { secret: 'do not leak' },
    ])
      expect(
        knowledgeSystemPrompt(knowledgePromptVariables(variable)),
      ).not.toContain('do not leak');
    expect(
      knowledgePromptVariables({ knowledgeRetrieval: 'always', secret: 1 }),
    ).toEqual({ knowledgeRetrieval: 'always' });
    for (const value of [null, true, 1, '', 'sometimes', []])
      expect(() =>
        knowledgePromptVariables({ knowledgeRetrieval: value }),
      ).toThrow(
        expect.objectContaining({ reason: 'INVALID_KNOWLEDGE_RETRIEVAL' }),
      );
  });
});
