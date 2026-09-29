/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import type { AIEmployee } from '../../collections/ai-employees';
import { KnowledgeBaseManager } from '../ai-employees/ai-knowledge-base';
import {
  getCurrentRoleNames,
  getKnowledgeBaseBackgroundPrompt,
  KNOWLEDGE_BASE_NO_ACCESS_PROMPT,
  KNOWLEDGE_BASE_PRE_RETRIEVED_PROMPT,
  normalizeKnowledgeBaseRetrievalStrategy,
  withDefaultKnowledgeBaseRetrievalStrategy,
} from '../ai-employees/ai-knowledge-base';

const createEmployee = (knowledgeBase: AIEmployee['knowledgeBase']): AIEmployee => ({
  username: 'atlas',
  enableKnowledgeBase: true,
  enabled: true,
  builtIn: false,
  knowledgeBase,
});

describe('knowledge base retrieval settings', () => {
  it('normalizes missing and invalid legacy strategies to always', () => {
    expect(normalizeKnowledgeBaseRetrievalStrategy(undefined)).toBe('always');
    expect(normalizeKnowledgeBaseRetrievalStrategy('invalid')).toBe('always');
    expect(normalizeKnowledgeBaseRetrievalStrategy('onDemand')).toBe('onDemand');
  });

  it('writes onDemand when a new employee has no valid strategy', () => {
    expect(withDefaultKnowledgeBaseRetrievalStrategy({ topK: 3 })).toEqual({
      topK: 3,
      retrievalStrategy: 'onDemand',
    });
    expect(withDefaultKnowledgeBaseRetrievalStrategy({ retrievalStrategy: 'always' })).toEqual({
      retrievalStrategy: 'always',
    });
  });

  it('prefers the unique current user role names and preserves state fallbacks', () => {
    expect(
      getCurrentRoleNames({
        currentUser: { roles: [{ name: 'editor' }, { name: 'reviewer' }, { name: 'editor' }, { name: 1 }] },
        currentRoles: ['member'],
        currentRole: 'guest',
      }),
    ).toEqual(['editor', 'reviewer']);
    expect(getCurrentRoleNames({ currentRoles: ['editor', 'reviewer', 'editor'], currentRole: 'member' })).toEqual([
      'editor',
      'reviewer',
    ]);
    expect(getCurrentRoleNames({ currentRoles: [], currentRole: 'member' })).toEqual([]);
    expect(getCurrentRoleNames({ currentRole: 'member' })).toEqual(['member']);
  });

  it('selects the knowledge-base background instruction for each retrieval state', () => {
    expect(getKnowledgeBaseBackgroundPrompt({ accessDenied: true, onDemand: true, preRetrieved: true })).toBe(
      KNOWLEDGE_BASE_NO_ACCESS_PROMPT,
    );
    expect(getKnowledgeBaseBackgroundPrompt({ accessDenied: false, onDemand: false, preRetrieved: true })).toBe(
      KNOWLEDGE_BASE_PRE_RETRIEVED_PROMPT,
    );
    expect(KNOWLEDGE_BASE_NO_ACCESS_PROMPT).toContain("First answer the user's question");
    expect(KNOWLEDGE_BASE_NO_ACCESS_PROMPT).toContain('Only after completing the answer');
    expect(KNOWLEDGE_BASE_NO_ACCESS_PROMPT).toContain("brief notice in the user's language");
    expect(KNOWLEDGE_BASE_NO_ACCESS_PROMPT).toContain('did not use knowledge-base content');
    expect(KNOWLEDGE_BASE_NO_ACCESS_PROMPT).toContain('visually prominent Markdown reminder');
    expect(KNOWLEDGE_BASE_NO_ACCESS_PROMPT).toContain('blockquote with a bold');
    expect(KNOWLEDGE_BASE_NO_ACCESS_PROMPT).toContain('contact an administrator');
    expect(KNOWLEDGE_BASE_PRE_RETRIEVED_PROMPT).toContain('<knowledgeBase>');
    expect(KNOWLEDGE_BASE_PRE_RETRIEVED_PROMPT).toContain('do not call the knowledge base retrieval tool again');
  });

  it('detects when the current roles cannot access any configured knowledge base', async () => {
    const getAccessibleKnowledgeBaseKeys = vi.fn().mockResolvedValue([]);
    const manager = new KnowledgeBaseManager({
      features: { knowledgeBase: { getAccessibleKnowledgeBaseKeys } },
    } as never);
    const employee = createEmployee({ knowledgeBaseKeys: ['handbook'], topK: 3, score: '0.6' });

    await expect(manager.hasAccessibleKnowledgeBase({ employee, roleNames: ['member'] })).resolves.toBe(false);
    expect(getAccessibleKnowledgeBaseKeys).toHaveBeenCalledWith({
      knowledgeBaseKeys: ['handbook'],
      roleNames: ['member'],
    });
  });

  it('passes an empty selection and all request roles to the search feature', async () => {
    const search = vi.fn().mockResolvedValue([{ content: 'Internal policy', metadata: {} }]);
    const manager = new KnowledgeBaseManager({
      features: { knowledgeBase: { search } },
    } as never);

    await expect(
      manager.retrievePrompt({
        employee: createEmployee({ knowledgeBaseKeys: [], topK: 3, score: '0.6' }),
        query: 'What is the internal policy?',
        roleNames: ['editor', 'reviewer'],
      }),
    ).resolves.toEqual({ prompt: 'Human: Internal policy', documents: [] });

    expect(search).toHaveBeenCalledWith({
      knowledgeBaseKeys: [],
      query: 'What is the internal policy?',
      topK: 3,
      score: '0.6',
      roleNames: ['editor', 'reviewer'],
    });
  });

  it('appends retrieved data for legacy prompts that do not contain the placeholder', async () => {
    const search = vi.fn().mockResolvedValue([{ content: 'Internal policy', metadata: {} }]);
    const manager = new KnowledgeBaseManager({
      features: { knowledgeBase: { search } },
    } as never);
    const employee = {
      ...createEmployee({ knowledgeBaseKeys: ['handbook'], topK: 3, score: '0.6' }),
      knowledgeBasePrompt: 'Use the following internal information.',
    };

    await expect(
      manager.retrievePrompt({
        employee,
        query: 'What is the internal policy?',
        roleNames: ['member'],
      }),
    ).resolves.toEqual({ prompt: 'Use the following internal information.\n\nInternal policy', documents: [] });
  });

  it('returns unique document references resolved from knowledgeBaseDocsId metadata', async () => {
    const search = vi.fn().mockResolvedValue([
      { content: 'Part A', metadata: { knowledgeBaseDocsId: 1 } },
      { content: 'Part B', metadata: { knowledgeBaseDocsId: 1 } },
      { content: 'Part C', metadata: { knowledgeBaseDocsId: 2 } },
      { content: 'External', metadata: {} },
    ]);
    const references = [
      { id: 1, title: 'Handbook', extname: '.pdf', url: '/files/main/main/aiKnowledgeBaseDocs/1.pdf' },
      { id: 2, title: 'Policy', extname: '.pdf', url: '/files/main/main/aiKnowledgeBaseDocs/2.pdf' },
    ];
    const getDocumentReferences = vi.fn().mockResolvedValue(references);
    const manager = new KnowledgeBaseManager({
      features: { knowledgeBase: { search, getDocumentReferences } },
    } as never);

    const result = await manager.retrievePrompt({
      employee: createEmployee({ knowledgeBaseKeys: ['handbook'], topK: 3, score: '0.6' }),
      query: 'What is the internal policy?',
      roleNames: ['member'],
    });

    expect(getDocumentReferences).toHaveBeenCalledWith([1, 2]);
    expect(result.documents).toEqual(references);
  });

  it('returns no document references when nothing matches', async () => {
    const getDocumentReferences = vi.fn();
    const manager = new KnowledgeBaseManager({
      features: { knowledgeBase: { search: vi.fn().mockResolvedValue([]), getDocumentReferences } },
    } as never);

    await expect(
      manager.retrievePrompt({
        employee: createEmployee({ knowledgeBaseKeys: ['handbook'], topK: 3, score: '0.6' }),
        query: 'Unknown',
        roleNames: ['member'],
      }),
    ).resolves.toEqual({ prompt: 'No document match in knowledge base', documents: [] });
    expect(getDocumentReferences).not.toHaveBeenCalled();
  });
});
