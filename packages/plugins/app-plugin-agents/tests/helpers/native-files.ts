import { MockLanguageModelV4 } from 'ai/test';
import { NativeFileInputs } from '../../server/online/files/service.js';
import type { NativeSessionStore } from '../../server/online/agent/persistence/store.js';
import type { ChatAttachmentService } from '../../server/core/conversations/attachments.js';
import type { ResolvedPageContext } from '../../shared/conversations.js';

/** Give each execution its own binding while forwarding the shared test behavior. */
export function fixtureModel(model: MockLanguageModelV4): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    supportedUrls: model.supportedUrls,
    doStream: (options) => model.doStream(options),
    doGenerate: (options) => model.doGenerate(options),
  });
}

/** This mock Provider's exact profile also permits plain text as a native fixture input. */
export function fixtureFileInputs(
  model: MockLanguageModelV4,
  files?: Pick<ChatAttachmentService, 'content'>,
) {
  return new NativeFileInputs({
    connectionFor: async () => ({
      provider: 'openai-compatible',
      baseUrl: 'https://fixture.invalid/v1',
      apiKey: null,
    }),
    createModel: () => fixtureModel(model),
    files,
    config: {
      profiles: [
        {
          modelService: 'fixture',
          model: 'chat',
          provider: 'openai-compatible',
          protocol: 'chat-completions',
          baseUrl: 'https://fixture.invalid/v1',
          extraction: 'local',
          nativeMediaTypes: [
            'image/png',
            'image/jpeg',
            'text/plain',
            'application/pdf',
          ],
        },
      ],
    },
  });
}

export async function projectNativeHistory(
  store: NativeSessionStore,
  files: Pick<ChatAttachmentService, 'content'> | undefined,
  userId: string,
  sessionId: string,
  context?: ResolvedPageContext,
  page = true,
) {
  const inputs = fixtureFileInputs(new MockLanguageModelV4(), files);
  const model = await inputs.model(
    { modelService: 'fixture', model: 'chat' },
    sessionId,
  );
  const snapshot = await store.executionSnapshot(userId, sessionId);
  const prepared = await inputs.prepare({
    model,
    snapshot,
    userId,
    sessionId,
    signal: new AbortController().signal,
  });
  const messages = await store.messages.model(prepared);
  const current = page
    ? await store.pageContext(userId, sessionId, context)
    : undefined;
  if (current) messages.push(current);
  return { ui: snapshot.original, model: messages, page: current };
}
