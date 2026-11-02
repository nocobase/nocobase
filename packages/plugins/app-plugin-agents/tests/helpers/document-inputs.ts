import { createChatAttachments } from '../../server/core/conversations/attachments.js';
import type { JSONSchema7 } from 'ai';
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import {
  workerExtractor,
  type TextExtractor,
} from '@nocobase/document-extractor';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { NativeFileInputs } from '../../server/online/files/service.js';
import { OnlineAgentService } from '../../server/online/agent/service.js';
import { createSessionManager } from '../../server/online/agent/persistence/manager.js';
import type {
  OnlineAgentContext,
  OnlineAgentOptions,
} from '../../server/online/agent/types.js';
import type { OnlineAgent } from '../../server/online/agent/contracts.js';
import type { FileInputsConfig } from '../../server/online/files/types.js';
import type {
  ModelConnection,
  languageModel,
} from '../../server/online/providers.js';
import type { ModelRef } from '../../shared/models.js';
import { createSandboxProvider } from '../../server/online/sandbox/provider.js';
import { createHarness } from '../harness.js';

export const documentActor: OnlineAgentContext = {
  user: { id: 'alice' },
  credentials: {},
  authorization: {
    identity: { principal: { type: 'user', id: 'alice' } },
  } as AuthorizationContext,
};
export const documentRef: ModelRef = { modelService: 'fixture', model: 'text' };
export const documentConnection: ModelConnection = {
  provider: 'deepseek',
  baseUrl: 'https://fixture.invalid/v1',
  apiKey: null,
};
export const countSchema: JSONSchema7 = {
  type: 'object',
  properties: { count: { type: 'number' } },
  required: ['count'],
  additionalProperties: false,
};

export function documentReply(
  text: string,
): Awaited<ReturnType<MockLanguageModelV4['doStream']>> {
  return {
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({ type: 'text-start', id: 'reply' });
        controller.enqueue({ type: 'text-delta', id: 'reply', delta: text });
        controller.enqueue({ type: 'text-end', id: 'reply' });
        controller.enqueue({
          type: 'finish',
          usage: {
            inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 1, text: 1, reasoning: 0 },
          },
          finishReason: { unified: 'stop', raw: 'stop' },
        });
        controller.close();
      },
    }),
  };
}

export async function createDocumentFixture(
  options: {
    config?: FileInputsConfig;
    extract?: TextExtractor;
    onWarning?: (message: string) => void;
    connectionFor?: (ref: ModelRef) => Promise<ModelConnection>;
    createModel?: typeof languageModel;
    stream?: MockLanguageModelV4['doStream'];
    supportedUrls?: MockLanguageModelV4['supportedUrls'];
    reply?: string;
    initial?: OnlineAgentOptions;
    register?: (service: OnlineAgentService) => void;
  } = {},
) {
  const h = await createHarness();
  let seq = 0;
  const ids = { next: () => `document-s2-${++seq}` };
  const attachments = createChatAttachments({
    tx: h.services.tx,
    basePath: () => '/main',
    storage: {
      store: async () => {
        throw new Error('Upload through the harness.');
      },
      bytes: async () => new Uint8Array(),
      stream: async () => new ReadableStream(),
      remove: async () => {},
    },
  });
  const sessions = createSessionManager({
    tx: h.services.tx,
    ids,
    attachments: attachments.links,
    basePath: () => '/main',
    now: () => new Date().toISOString(),
  });
  const prompts: Parameters<MockLanguageModelV4['doStream']>[0]['prompt'][] =
    [];
  const connections: ModelConnection[] = [];
  const extracts = vi.fn<TextExtractor>(options.extract ?? workerExtractor());
  const connectionFor = vi.fn(
    options.connectionFor ?? (async () => ({ ...documentConnection })),
  );
  const fileInputs = new NativeFileInputs({
    connectionFor,
    files: h.services.chatAttachments,
    config: options.config,
    extract: extracts,
    onWarning: options.onWarning,
    createModel:
      options.createModel ??
      ((connection) => {
        const captured = { ...connection };
        return new MockLanguageModelV4({
          supportedUrls: options.supportedUrls,
          doStream: async (input) => {
            prompts.push(input.prompt);
            connections.push(captured);
            return options.stream
              ? options.stream(input)
              : documentReply(options.reply ?? 'Read the document.');
          },
        });
      }),
  });
  const errors: unknown[] = [];
  const service = new OnlineAgentService({
    sandboxProvider: createSandboxProvider({ skills: h.services.skills }),
    sessions,
    ids,
    fileInputs,
    model: (ref, id) => fileInputs.model(ref, id),
    defaultModel: async () => documentRef,
    onError: (error) => errors.push(error),
  });
  options.register?.(service);
  const agent = await service.realtime(
    documentActor,
    options.initial ?? { systemPrompt: 'Follow application permissions.' },
  );
  const rows = (id = agent.sessionId) =>
    h.database
      .connection()
      .repository('agConversationMessages')
      .findMany({
        filter: { conversationId: id },
        sort: (sort) => sort.field('seq').asc(),
      });
  return {
    h,
    service,
    sessions,
    fileInputs,
    agent,
    errors,
    prompts,
    connections,
    connectionFor,
    extracts,
    rows,
    async close() {
      await service.shutdown();
      await h.close();
    },
    async settle(session: OnlineAgent = agent) {
      await vi.waitFor(
        async () => {
          if ((await session.status()) !== 'idle')
            throw new Error('Execution has not finalized.');
        },
        { timeout: 10_000 },
      );
    },
    upload(
      filename = 'report.docx',
      mediaType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      bytes = readFileSync(
        new URL('../fixtures/document-inputs/report.docx', import.meta.url),
      ),
    ) {
      return h.services.chatAttachments.upload(
        'alice',
        new File([bytes], filename, { type: mediaType }),
      );
    },
  };
}
export function documentToolCall(
  name: string,
  callId: string,
  reasoning = false,
): Awaited<ReturnType<MockLanguageModelV4['doStream']>> {
  return {
    stream: new ReadableStream({
      start(controller) {
        if (reasoning) {
          controller.enqueue({
            type: 'reasoning-start',
            id: 'reasoning',
            providerMetadata: {
              fixture: { signature: 'private-document-signature' },
            },
          });
          controller.enqueue({
            type: 'reasoning-delta',
            id: 'reasoning',
            delta: 'private-document-thought',
          });
          controller.enqueue({ type: 'reasoning-end', id: 'reasoning' });
        }
        controller.enqueue({
          type: 'tool-call',
          toolCallId: callId,
          toolName: name,
          input: '{}',
        });
        controller.enqueue({
          type: 'finish',
          usage: {
            inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 1, text: 1, reasoning: 0 },
          },
          finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
        });
        controller.close();
      },
    }),
  };
}
