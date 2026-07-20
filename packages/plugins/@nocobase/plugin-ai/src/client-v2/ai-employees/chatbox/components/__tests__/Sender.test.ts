/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import type { AIEmployee, ContextItem } from '../../../types';
import { buildSenderSendOptions, mergeSenderContextItems } from '../Sender';

const employee: AIEmployee = {
  username: 'sales',
  nickname: 'Sales assistant',
};

const context = (uid: string, title?: string): ContextItem => ({
  type: 'flow-model',
  uid,
  title,
});

describe('Sender options helpers', () => {
  it('deduplicates context items in send order', () => {
    expect(
      mergeSenderContextItems([context('manual-1'), context('shared', 'First shared'), context('shared', 'Ignored')]),
    ).toEqual([context('manual-1'), context('shared', 'First shared')]);
  });

  it('builds direct send payload from AI chat box defaults', () => {
    expect(
      buildSenderSendOptions({
        content: '',
        currentConversation: undefined,
        currentEmployee: employee,
        systemMessage: '',
        attachments: [{ filename: 'draft.txt', status: 'done' }],
        contextItems: [context('manual-1')],
        defaultSystemMessage: 'Use sales tone',
        defaultUserMessage: 'Summarize this block',
        skillSettings: null,
        webSearch: true,
        scope: 'chat-box-1',
      }),
    ).toMatchObject({
      sessionId: undefined,
      aiEmployee: employee,
      systemMessage: 'Use sales tone',
      messages: [{ type: 'text', content: 'Summarize this block' }],
      attachments: [{ filename: 'draft.txt', status: 'done' }],
      workContext: [context('manual-1')],
      webSearch: true,
      scope: 'chat-box-1',
    });
  });

  it('honors disabled upload and web search options without dropping work context', () => {
    expect(
      buildSenderSendOptions({
        content: 'Hello',
        currentEmployee: employee,
        attachments: [{ filename: 'draft.txt', status: 'done' }],
        contextItems: [context('manual-1')],
        webSearch: true,
        uploadEnabled: false,
        webSearchEnabled: false,
      }),
    ).toMatchObject({
      messages: [{ type: 'text', content: 'Hello' }],
      attachments: undefined,
      workContext: [context('manual-1')],
      webSearch: false,
    });
  });

  it('does not build payload without an employee or sendable content', () => {
    expect(
      buildSenderSendOptions({
        content: '',
        currentEmployee: undefined,
        defaultUserMessage: 'Hello',
      }),
    ).toBeNull();
    expect(
      buildSenderSendOptions({
        content: '',
        currentEmployee: employee,
      }),
    ).toBeNull();
  });
});
