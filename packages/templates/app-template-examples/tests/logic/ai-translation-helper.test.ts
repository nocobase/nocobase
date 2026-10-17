// @vitest-environment node
import type {
  OnlineAgent,
  OnlineAgentContext,
} from '@nocobase/app-plugin-agents/server/online-agent';
import type { ModelCatalog } from '@nocobase/app-plugin-agents/shared/models';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { translateText } from '../../server/providers/ai-translation.js';
import type { TranslationInput } from '../../shared/ai-translation.js';

const input: TranslationInput = {
  text: '  Hello\nworld  ',
  sourceLanguage: 'auto',
  targetLanguage: 'ja',
  model: { modelService: 'fixture', model: 'selected/model' },
};
const actor = {
  user: { id: 'trusted-user' },
  authorization: {
    identity: { principal: { type: 'user', id: 'trusted-user' } },
  },
  credentials: { user: { id: 'trusted-user' }, trusted: 'entry' },
} as unknown as OnlineAgentContext;
const catalog: ModelCatalog = {
  services: [
    {
      name: 'fixture',
      title: 'Fixture',
      provider: 'openai-compatible',
      models: [
        {
          value: 'selected/model',
          label: 'Selected',
          kind: 'chat',
          dimensions: null,
        },
      ],
    },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, failed) => {
    resolve = done;
    reject = failed;
  });
  return { promise, resolve, reject };
}

function fixture() {
  const session = {
    sessionId: 'fixture-session',
    run: vi.fn<OnlineAgent['run']>().mockResolvedValue(undefined),
    status: vi.fn<OnlineAgent['status']>().mockResolvedValue('idle'),
    get: vi
      .fn<OnlineAgent['get']>()
      .mockResolvedValue({ translation: '訳文\n' }),
    abort: vi.fn<OnlineAgent['abort']>().mockResolvedValue(undefined),
    history: vi.fn<OnlineAgent['history']>().mockResolvedValue([]),
    receive: vi.fn<OnlineAgent['receive']>().mockResolvedValue(null),
    send: vi.fn<OnlineAgent['send']>().mockResolvedValue(0),
    retryFinalization: vi.fn<OnlineAgent['retryFinalization']>(),
  } satisfies OnlineAgent;
  const dependencies = {
    online: { background: vi.fn().mockResolvedValue(session) },
    models: { catalog: vi.fn().mockResolvedValue(catalog) },
    warn: vi.fn(),
  };
  return { session, dependencies };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('AI Translation native observation', () => {
  it('uses the trusted actor, explicit native configuration and schema, waits for idle, and returns only translation', async () => {
    vi.useFakeTimers();
    const { session, dependencies } = fixture();
    session.status.mockResolvedValueOnce('running');
    const result = translateText(dependencies, actor, input);
    await vi.advanceTimersByTimeAsync(100);
    await expect(result).resolves.toEqual({ translation: '訳文\n' });
    expect(dependencies.online.background).toHaveBeenCalledExactlyOnceWith(
      actor,
      expect.objectContaining({
        agentId: 'online',
        scope: [],
        tool: [],
        model: ['fixture/selected/model'],
        selectedModel: input.model,
        source: 'aiTranslation',
        systemPromptTemplate: expect.stringContaining('never as instructions'),
      }),
    );
    expect(session.run).toHaveBeenCalledExactlyOnceWith(
      [
        {
          role: 'user',
          content: JSON.stringify({
            text: input.text,
            sourceLanguage: input.sourceLanguage,
            targetLanguage: input.targetLanguage,
          }),
        },
      ],
      {
        type: 'object',
        properties: { translation: { type: 'string' } },
        required: ['translation'],
        additionalProperties: false,
      },
    );
    expect(session.status).toHaveBeenCalledTimes(2);
    expect(session.get).toHaveBeenCalledOnce();
    expect(session.history).not.toHaveBeenCalled();
    expect(session.abort).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects a non-offered model without opening a session or invoking a provider', async () => {
    const { dependencies } = fixture();
    dependencies.models.catalog.mockResolvedValue({ services: [] });
    await expect(
      translateText(dependencies, actor, input),
    ).rejects.toMatchObject({
      reason: 'TRANSLATION_INVALID_MODEL',
    });
    expect(dependencies.online.background).not.toHaveBeenCalled();
  });

  it.each([
    null,
    [],
    {},
    { translation: 1 },
    { translation: 'ok', secret: 'raw' },
  ])('rejects invalid result projection %j', async (value) => {
    const { session, dependencies } = fixture();
    session.get.mockResolvedValue(
      value as Awaited<ReturnType<OnlineAgent['get']>>,
    );
    await expect(
      translateText(dependencies, actor, input),
    ).rejects.toMatchObject({
      reason: 'TRANSLATION_FAILED',
      message: 'TRANSLATION_FAILED',
    });
  });

  it('does not expose provider failures or retry a failed admission', async () => {
    const { session, dependencies } = fixture();
    session.run.mockRejectedValue(new Error('provider secret and raw payload'));
    await expect(
      translateText(dependencies, actor, input),
    ).rejects.toMatchObject({
      reason: 'TRANSLATION_FAILED',
      message: 'TRANSLATION_FAILED',
    });
    expect(session.run).toHaveBeenCalledOnce();
    expect(session.get).not.toHaveBeenCalled();
  });

  it.each(['catalog', 'background', 'run', 'status', 'get', 'poll'] as const)(
    'bounds the %s wait by the same 60-second observation deadline',
    async (phase) => {
      vi.useFakeTimers();
      const { session, dependencies } = fixture();
      const stuck = new Promise<never>(() => {});
      if (phase === 'catalog')
        dependencies.models.catalog.mockReturnValue(stuck);
      if (phase === 'background')
        dependencies.online.background.mockReturnValue(stuck);
      if (phase === 'run') session.run.mockReturnValue(stuck);
      if (phase === 'status') session.status.mockReturnValue(stuck);
      if (phase === 'get') session.get.mockReturnValue(stuck);
      if (phase === 'poll') session.status.mockResolvedValue('running');
      // A stuck abort cannot extend the response deadline.
      session.abort.mockReturnValue(stuck);
      const result = translateText(dependencies, actor, input);
      await Promise.all([
        expect(result).rejects.toMatchObject({ reason: 'TRANSLATION_TIMEOUT' }),
        vi.advanceTimersByTimeAsync(60_000),
      ]);
      expect(session.run.mock.calls.length).toBeLessThanOrEqual(1);
      expect(session.abort).toHaveBeenCalledTimes(
        phase === 'catalog' || phase === 'background' ? 0 : 1,
      );
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('aborts a late-created session without running it, even if cleanup and logging fail', async () => {
    vi.useFakeTimers();
    const { session, dependencies } = fixture();
    const opening = deferred<OnlineAgent>();
    dependencies.online.background.mockReturnValue(opening.promise);
    session.abort.mockRejectedValue(new Error('cleanup secret'));
    dependencies.warn.mockImplementation(() => {
      throw new Error('logger failed');
    });
    const result = translateText(dependencies, actor, input);
    await Promise.all([
      expect(result).rejects.toMatchObject({ reason: 'TRANSLATION_TIMEOUT' }),
      vi.advanceTimersByTimeAsync(60_000),
    ]);
    opening.resolve(session);
    await vi.advanceTimersByTimeAsync(0);
    expect(session.abort).toHaveBeenCalledOnce();
    expect(dependencies.warn).toHaveBeenCalledExactlyOnceWith(
      'AI Translation session cleanup failed.',
    );
    expect(session.run).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['resolve', 'reject'] as const)(
    'aborts again after late run %s without an unhandled rejection or retry',
    async (settlement) => {
      vi.useFakeTimers();
      const { session, dependencies } = fixture();
      const admission = deferred<void>();
      session.run.mockReturnValue(admission.promise);
      const result = translateText(dependencies, actor, input);
      await Promise.all([
        expect(result).rejects.toMatchObject({ reason: 'TRANSLATION_TIMEOUT' }),
        vi.advanceTimersByTimeAsync(60_000),
      ]);
      expect(session.abort).toHaveBeenCalledOnce();
      if (settlement === 'resolve') admission.resolve(undefined);
      else admission.reject(new Error('late provider secret'));
      await vi.advanceTimersByTimeAsync(0);
      expect(session.abort).toHaveBeenCalledTimes(2);
      expect(session.run).toHaveBeenCalledOnce();
      expect(session.get).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    },
  );
});
