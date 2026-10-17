import { describe, expect, expectTypeOf, it } from 'vitest';
import { createRequire } from 'node:module';
import {
  appUIMessageText,
  isAppUIJson,
  validateAppUIMessages,
  type AppUIData,
  type AppUIMessage,
  type AppUIMessageMetadata,
  type AppUITools,
} from '@nocobase/app-plugin-agents/shared/online-agent';
import type { AppUIMessage as ClientMessage } from '@nocobase/app-plugin-agents/client/chat';
import type { AppUIMessage as ServerMessage } from '@nocobase/app-plugin-agents/server/online-agent';
import type { useChat } from '@ai-sdk/react';
import {
  convertToModelMessages,
  createUIMessageStream,
  readUIMessageStream,
  type UIMessage,
} from 'ai';

const metadata: AppUIMessageMetadata = {
  conversationId: 'conversation',
  createdAt: '2026-10-17T12:00:00Z',
  revision: 1,
  seq: 2,
  executionId: 'execution',
  turnId: 'turn',
  sourceRecords: [
    { recordId: 'source-1', seq: 2, partId: 'block-1', partIndex: 0 },
    { recordId: 'source-2', seq: 3, partId: 'block-2', partIndex: 2 },
  ],
};

const message: AppUIMessage = {
  id: 'assistant',
  role: 'assistant',
  metadata,
  parts: [
    { type: 'text', text: 'First' },
    {
      type: 'data-business',
      id: 'card',
      data: { kind: 'plan', id: 'plan', payload: { state: 'ready' } },
    },
    { type: 'text', text: 'Second' },
    {
      type: 'file',
      mediaType: 'image/png',
      url: 'https://app.example/api/authorizedAttachment',
    },
    {
      type: 'tool-lookup',
      toolCallId: 'lookup',
      state: 'output-available',
      input: { id: 'public' },
      output: { title: 'Public result' },
    },
  ],
};

describe('public SDK UI message contract', () => {
  it('resolves the React client and server to the same SDK installation', () => {
    const serverRequire = createRequire(import.meta.url);
    const clientRequire = createRequire(serverRequire.resolve('@ai-sdk/react'));
    expect(clientRequire.resolve('ai')).toBe(serverRequire.resolve('ai'));
  });

  it('is the SDK type across formal client and server entries', () => {
    expectTypeOf<AppUIMessage>().toEqualTypeOf<
      UIMessage<AppUIMessageMetadata, AppUIData, AppUITools>
    >();
    expectTypeOf<ClientMessage>().toEqualTypeOf<ServerMessage>();
    expectTypeOf<
      ReturnType<typeof useChat<AppUIMessage>>['messages']
    >().toEqualTypeOf<AppUIMessage[]>();
  });

  it('round trips ordered public parts as JSON and converts trusted history with the SDK', async () => {
    const saved: unknown = JSON.parse(JSON.stringify([message]));
    const validated = await validateAppUIMessages(saved);
    expect(validated).toEqual([message]);
    expect(appUIMessageText(validated[0]!)).toBe('First\nSecond');
    const model = await convertToModelMessages(validated);
    expect(model).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'assistant',
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'tool-call',
              toolCallId: 'lookup',
            }),
          ]),
        }),
        expect.objectContaining({
          role: 'tool',
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'tool-result',
              toolCallId: 'lookup',
            }),
          ]),
        }),
      ]),
    );
    expect(JSON.stringify(model)).not.toContain('data-business');
  });

  it('uses real SDK stream assembly for text, data and approval parts', async () => {
    const stream = createUIMessageStream<AppUIMessage>({
      execute: ({ writer }) => {
        writer.write({
          type: 'start',
          messageId: 'stable',
          messageMetadata: metadata,
        });
        writer.write({ type: 'text-start', id: 'text' });
        writer.write({ type: 'text-delta', id: 'text', delta: 'Hello' });
        writer.write({ type: 'text-end', id: 'text' });
        writer.write({
          type: 'data-notice',
          id: 'notice',
          data: { type: 'saved', title: 'Saving' },
        });
        writer.write({
          type: 'data-notice',
          id: 'notice',
          data: { type: 'saved', title: 'Saved' },
        });
        writer.write({
          type: 'tool-input-available',
          toolCallId: 'call',
          toolName: 'lookup',
          input: { id: 'public' },
        });
        writer.write({
          type: 'tool-approval-request',
          approvalId: 'approval',
          toolCallId: 'call',
        });
        writer.write({ type: 'finish' });
      },
    });
    let assembled: AppUIMessage | undefined;
    for await (const current of readUIMessageStream<AppUIMessage>({ stream }))
      assembled = current;
    // SDK assembly includes optional undefined fields; the stored snapshot is JSON.
    const snapshot: unknown = JSON.parse(JSON.stringify([assembled]));
    const validated = await validateAppUIMessages(snapshot);
    expect(validated[0]).toMatchObject({
      id: 'stable',
      metadata,
      parts: [
        { type: 'text', text: 'Hello' },
        { type: 'data-notice', id: 'notice', data: { title: 'Saved' } },
        {
          type: 'tool-lookup',
          toolCallId: 'call',
          state: 'approval-requested',
          approval: { id: 'approval' },
        },
      ],
    });
  });

  it.each([
    { ...message, metadata: { ...metadata, credentials: 'private' } },
    { ...message, metadata: undefined },
    { ...message, parts: [{ type: 'data-unknown', data: {} }] },
    {
      ...message,
      parts: [{ type: 'data-business', data: { kind: 'plan', id: '1' } }],
    },
    {
      ...message,
      parts: [
        {
          type: 'tool-lookup',
          toolCallId: '1',
          state: 'approval-requested',
          input: {},
        },
      ],
    },
    {
      ...message,
      parts: [
        {
          type: 'text',
          text: 'Public',
          providerMetadata: { provider: { token: 'private' } },
        },
      ],
    },
  ])('rejects malformed or private public data', async (invalid) => {
    await expect(validateAppUIMessages([invalid])).rejects.toThrow();
  });

  it('rejects duplicate message identities', async () => {
    await expect(validateAppUIMessages([message, message])).rejects.toThrow(
      'Duplicate',
    );
  });

  it('rejects JSON values that would change or disappear on save', () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    for (const invalid of [
      undefined,
      NaN,
      Infinity,
      1n,
      new Date(),
      new Map(),
      { value: undefined },
      [undefined],
      Array(2),
      cycle,
      { toJSON: () => 'hidden' },
    ]) {
      expect(isAppUIJson(invalid)).toBe(false);
    }
    const shared = { title: 'Public' };
    expect(isAppUIJson({ first: shared, second: shared })).toBe(true);
  });
});
