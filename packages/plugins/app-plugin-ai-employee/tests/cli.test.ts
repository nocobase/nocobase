// @vitest-environment node
import {
  CommandError,
  type AppCommand,
  type AppCommandRuntime,
} from '@nocobase/app-cli';
import { bindAppCommand, runAppCommand } from '@nocobase/app-cli/testing';
import type { Application } from '@nocobase/app-server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import cliPlugin from '../cli/index.js';
import LLMModels from '../cli/models.js';
import LLMTest from '../cli/test.js';
import packageMetadata from '../package.json' with { type: 'json' };

const provider = vi.hoisted(() => ({
  construct: vi.fn(),
  listModels: vi.fn(),
  invoke: vi.fn(),
  createManager: vi.fn(),
  createModel: vi.fn(),
}));

vi.mock('@nocobase/ai-employee', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/ai-employee')>();
  // Use the real registry and inherited testFlight: no network, but the actual completion contract is exercised.
  class TestProvider extends actual.LLMProvider {
    constructor(options: import('@nocobase/ai-employee').LLMProviderOptions) {
      provider.construct(options);
      super(options);
    }
    createModel() {
      provider.createModel(this.modelOptions);
      return { invoke: provider.invoke };
    }
    override listModels() {
      return provider.listModels();
    }
  }
  return {
    ...actual,
    createAIManager: () => {
      provider.createManager();
      const manager = actual.createAIManager();
      for (const [name, meta] of manager.llmProviderManager.llmProviders) {
        manager.llmProviderManager.llmProviders.set(name, {
          ...meta,
          provider: TestProvider,
        });
      }
      return manager;
    },
  };
});

const secret = 'raw-credential-do-not-output';
const services = {
  primary: {
    provider: 'openai',
    options: {
      apiKey: secret,
      baseURL: 'https://example.test/v1?tenant=private-query',
      headers: { 'X-Custom': 'private-header' },
    },
    enabledModels: [{ label: 'Curated model', value: 'curated-only' }],
    modelOptions: { model: 'configured-model', temperature: 0.7 },
  },
};

function bind(
  command: typeof AppCommand,
  ai: unknown = { llmServices: services },
  invocation?: { command: string; args: string[] },
) {
  const start = vi.fn(() => {
    throw new Error('Must not start');
  });
  const registerProviders = vi.fn(() => {
    throw new Error('Must not register providers');
  });
  const resolve = vi.fn(() => {
    throw new Error('Must not resolve database or other application services');
  });
  const get = vi.fn(() => ai);
  const shutdown = vi.fn(async () => {});
  const destroy = vi.fn(async () => {});
  const loadRuntime = vi.fn(
    async () =>
      ({
        env: { LLM_API_KEY: 'not-the-final-key' },
        scope: { destroy },
      }) as unknown as AppCommandRuntime,
  );
  const app = {
    config: { get },
    start,
    registerProviders,
    container: { resolve },
    shutdown,
  } as unknown as Application;
  const createApp = vi.fn((_runtime: AppCommandRuntime) => app);
  class LocatedCommand extends command {
    protected override cliCommand(args: readonly string[]) {
      return invocation
        ? { command: invocation.command, args: [...invocation.args, ...args] }
        : super.cliCommand(args);
    }
  }
  const Bound = bindAppCommand(LocatedCommand, {
    id: `ai-employee:${command === LLMModels ? 'models' : 'test'}`,
    rootDir: import.meta.dirname,
    loadRuntime,
    createApp,
  });
  return {
    Bound,
    app,
    start,
    registerProviders,
    resolve,
    get,
    shutdown,
    destroy,
    loadRuntime,
    createApp,
  };
}

function expectNoStartup(fixture: ReturnType<typeof bind>) {
  expect(fixture.start).not.toHaveBeenCalled();
  expect(fixture.registerProviders).not.toHaveBeenCalled();
  expect(fixture.resolve).not.toHaveBeenCalled();
  expect(fixture.get).toHaveBeenCalledExactlyOnceWith('ai');
  expect(fixture.shutdown).toHaveBeenCalledOnce();
  expect(fixture.destroy).toHaveBeenCalledOnce();
}

beforeEach(() => {
  vi.clearAllMocks();
  provider.construct.mockReset();
  provider.createManager.mockReset();
  provider.listModels.mockReset().mockResolvedValue({
    models: [
      { id: 'gpt-A', options: { apiKey: secret } },
      { id: 'other-model' },
      { id: 'GPT-b' },
    ],
  });
  provider.invoke.mockReset().mockResolvedValue({
    content: 'full completion must never be printed',
    usage: { tokens: 10 },
    secret,
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('AI Employee CLI contribution', () => {
  it('contributes runtime commands and paired source/published exports', () => {
    expect(cliPlugin).toMatchObject({
      topic: 'ai-employee',
      commands: { models: LLMModels, test: LLMTest },
      devCommands: {},
    });
    expect(packageMetadata.exports['./cli']).toEqual({
      types: './cli/index.ts',
      import: './cli/index.ts',
    });
    expect(packageMetadata.publishConfig.exports['./cli']).toEqual({
      types: './dist/cli/index.d.ts',
      import: './dist/cli/index.js',
    });
    expect(packageMetadata.peerDependencies).toMatchObject({
      '@nocobase/app-cli': 'workspace:^',
      '@oclif/core': 'catalog:',
    });
    expect(LLMModels.flags).not.toHaveProperty('json');
    expect(LLMTest.summary).toMatch(/cost/i);
    expect(LLMTest.description).toMatch(/charges/i);
  });
});

describe('ai-employee models', () => {
  it('uses final config and returns only IDs from the live built-in provider in one JSON document', async () => {
    const fixture = bind(LLMModels);
    const run = await runAppCommand(fixture.Bound, ['primary', '--json']);
    expect(run.exitCode).toBeUndefined();
    expect(run.json()).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'ai-employee models',
      status: 'success',
      warnings: [],
      result: {
        service: 'primary',
        provider: 'openai',
        models: [{ id: 'gpt-A' }, { id: 'other-model' }, { id: 'GPT-b' }],
      },
    });
    expect(provider.construct).toHaveBeenCalledExactlyOnceWith({
      serviceOptions: services.primary.options,
    });
    expect(provider.listModels).toHaveBeenCalledOnce();
    expect(provider.invoke).not.toHaveBeenCalled();
    expect(run.stdout + run.stderr).not.toContain(secret);
    expectNoStartup(fixture);
  });

  it('prints IDs only and filters by a case-insensitive substring', async () => {
    const fixture = bind(LLMModels);
    const run = await runAppCommand(fixture.Bound, [
      'primary',
      '--search',
      'GpT',
    ]);
    expect(run.stdout).toBe('gpt-A\nGPT-b\n');
    expect(run.stderr).toBe('');
    expect(run.result).toEqual({
      service: 'primary',
      provider: 'openai',
      models: [{ id: 'gpt-A' }, { id: 'GPT-b' }],
    });
    expectNoStartup(fixture);
  });

  it('applies the same search in JSON mode', async () => {
    const { Bound } = bind(LLMModels);
    const run = await runAppCommand(Bound, [
      'primary',
      '--search',
      'OTHER',
      '--json',
    ]);
    expect(run.json()).toMatchObject({
      result: { models: [{ id: 'other-model' }] },
    });
  });

  it.each([{ models: [] }, { models: [{ id: 'no-match' }] }])(
    'returns an empty list when no models match',
    async ({ models }) => {
      provider.listModels.mockResolvedValue({ models });
      const { Bound } = bind(LLMModels);
      const run = await runAppCommand(Bound, [
        'primary',
        '--search',
        'absent',
        '--json',
      ]);
      expect(run.json()).toMatchObject({ ok: true, result: { models: [] } });
    },
  );

  it('accepts a built-in provider that does not require an API key', async () => {
    const { Bound } = bind(LLMModels, {
      llmServices: { local: { provider: 'ollama' } },
    });
    const run = await runAppCommand(Bound, ['local', '--json']);
    expect(run.json()).toMatchObject({
      ok: true,
      result: { service: 'local', provider: 'ollama' },
    });
  });

  it.each([
    {},
    { models: null },
    { models: [{ id: 42 }] },
    { models: [null] },
    { models: [{ id: '' }] },
    { models: [], code: 401 },
  ])(
    'reports malformed/failed provider responses safely: %j',
    async (response) => {
      provider.listModels.mockResolvedValue(response);
      const fixture = bind(LLMModels);
      const run = await runAppCommand(fixture.Bound, ['primary', '--json']);
      expect(run.json()).toMatchObject({
        ok: false,
        error: { code: 'AI_LLM_PROVIDER_FAILED' },
      });
      expect(run.exitCode).toBe(1);
      expectNoStartup(fixture);
    },
  );
});

describe('ai-employee test', () => {
  it('makes one minimal real provider completion and returns only callability, not the response', async () => {
    const fixture = bind(LLMTest);
    const run = await runAppCommand(fixture.Bound, [
      'primary',
      '--model',
      'explicit-model',
      '--json',
    ]);
    expect(run.json()).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'ai-employee test',
      status: 'success',
      warnings: [],
      result: {
        service: 'primary',
        provider: 'openai',
        model: 'explicit-model',
        callable: true,
      },
    });
    expect(provider.construct).toHaveBeenCalledExactlyOnceWith({
      serviceOptions: services.primary.options,
      modelOptions: { model: 'explicit-model', maxRetries: 0 },
    });
    expect(provider.createModel).toHaveBeenCalledExactlyOnceWith({
      model: 'explicit-model',
      maxRetries: 0,
    });
    expect(provider.invoke).toHaveBeenCalledExactlyOnceWith('hello');
    expect(provider.listModels).not.toHaveBeenCalled();
    expect(run.stdout + run.stderr).not.toMatch(
      /full completion|tokens|raw-credential/,
    );
    expectNoStartup(fixture);
  });

  it('prints only a callability acknowledgement in plain mode', async () => {
    const { Bound } = bind(LLMTest);
    const run = await runAppCommand(Bound, [
      'primary',
      '--model',
      'explicit-model',
    ]);
    expect(run.stdout).toBe('Model is callable.\n');
    expect(run.stderr).toBe('');
  });

  it.each([
    { args: ['primary'] },
    { args: ['primary', '--model', '   '] },
    { args: [] },
  ])(
    'requires an explicit non-empty model before loading the app: %j',
    async ({ args }) => {
      const fixture = bind(LLMTest);
      const run = await runAppCommand(fixture.Bound, [...args, '--json']);
      expect(run.json()).toMatchObject({
        ok: false,
        error: { code: 'INVALID_USAGE' },
      });
      expect(run.exitCode).toBe(2);
      expect(fixture.loadRuntime).not.toHaveBeenCalled();
      expect(provider.invoke).not.toHaveBeenCalled();
    },
  );
});

describe.each([LLMModels, LLMTest])('%s configuration failures', (command) => {
  const args = command === LLMTest ? ['--model', 'explicit-model'] : [];
  it.each([undefined, {}, { llmServices: {} }])(
    'reports an absent service without invoking a provider: %j',
    async (ai) => {
      const fixture = bind(command, ai ?? {});
      const run = await runAppCommand(fixture.Bound, [
        'missing',
        ...args,
        '--json',
      ]);
      expect(run.json()).toMatchObject({
        ok: false,
        error: { code: 'AI_LLM_SERVICE_NOT_FOUND' },
      });
      expect(run.exitCode).toBe(1);
      expect(provider.construct).not.toHaveBeenCalled();
      expectNoStartup(fixture);
    },
  );

  it('does not resolve prototype properties as configured services', async () => {
    const { Bound } = bind(command, { llmServices: {} });
    const run = await runAppCommand(Bound, ['toString', ...args, '--json']);
    expect(run.json()).toMatchObject({
      ok: false,
      error: { code: 'AI_LLM_SERVICE_NOT_FOUND' },
    });
  });

  it.each(
    [
      [],
      'invalid',
      { primary: null },
      { primary: { provider: '' } },
      { primary: { provider: 'openai', options: secret } },
      { primary: { provider: 'openai', enabledModels: ['old-shape'] } },
      { primary: { provider: 'openai', enabled: 'invalid' } },
    ].map((llmServices) => ({ llmServices })),
  )('reuses the structural config validator: %j', async ({ llmServices }) => {
    const fixture = bind(command, { llmServices });
    const run = await runAppCommand(fixture.Bound, [
      'primary',
      ...args,
      '--json',
    ]);
    expect(run.json()).toMatchObject({
      ok: false,
      error: {
        code: 'AI_LLM_CONFIG_INVALID',
        details: { issues: expect.any(Array) },
        suggestions: [
          {
            run: {
              command: 'pnpm',
              args: ['nocobase', 'config', 'check', '--no-connect', '--json'],
            },
          },
        ],
      },
    });
    expect(run.stdout).not.toContain(secret);
    expect(provider.construct).not.toHaveBeenCalled();
    expectNoStartup(fixture);
  });

  it.each([undefined, null, '', '   '])(
    'reports missing keys and the config-check repair guidance: %j',
    async (apiKey) => {
      const fixture = bind(command, {
        llmServices: { primary: { provider: 'openai', options: { apiKey } } },
      });
      const run = await runAppCommand(fixture.Bound, [
        'primary',
        ...args,
        '--json',
      ]);
      expect(run.json()).toMatchObject({
        ok: false,
        error: { code: 'AI_LLM_API_KEY_MISSING' },
      });
      expect(run.stdout).toContain(
        "config set --from-env 'ai.llmServices.primary.options.apiKey=<VARIABLE>'",
      );
      expect(provider.construct).not.toHaveBeenCalled();
      expectNoStartup(fixture);
    },
  );

  it('rejects application-registered providers and recommends the management UI without startup', async () => {
    const fixture = bind(command, {
      llmServices: {
        primary: { provider: 'custom-provider', options: { secret } },
      },
    });
    const run = await runAppCommand(fixture.Bound, ['primary', ...args]);
    expect(run.error).toBeInstanceOf(CommandError);
    expect(run.error).toMatchObject({
      errorCode: 'AI_LLM_PROVIDER_UNSUPPORTED',
      commandSuggestions: [
        { message: expect.stringContaining('management UI') },
      ],
    });
    expect(run.exitCode).toBe(1);
    expectNoStartup(fixture);
  });
});

const outputModes = [
  { json: false, debug: false },
  { json: true, debug: false },
  { json: false, debug: true },
  { json: true, debug: true },
];
const sensitiveExcerpt = `Map keys must be unique\n  apiKey: ${secret}\n  apiKey: synthetic-second-key\n${JSON.stringify(services.primary.options)}`;
const cleanupWarning =
  'Application cleanup failed. Sensitive diagnostic details were omitted.';

function expectConfidential(run: Awaited<ReturnType<typeof runAppCommand>>) {
  const printed =
    run.stdout + run.stderr + String(run.error) + JSON.stringify(run.result);
  for (const value of [
    secret,
    'synthetic-second-key',
    'private-query',
    'private-header',
    'nested-private-cause',
    'Map keys must be unique',
  ]) {
    expect(printed).not.toContain(value);
  }
  if (run.error) {
    expect(run.error).toMatchObject({ underlyingError: undefined });
    expect(run.error).not.toHaveProperty('cause');
  }
}

describe.each([LLMModels, LLMTest])(
  '%s lifecycle confidentiality',
  (command) => {
    const args =
      command === LLMTest
        ? ['primary', '--model', 'explicit-model']
        : ['primary'];
    describe.each(outputModes)('json=$json debug=$debug', ({ json, debug }) => {
      beforeEach(() => vi.stubEnv('NOCOBASE_CLI_DEBUG', debug ? '1' : '0'));
      const flags = json ? ['--json'] : [];

      it.each(['loadRuntime', 'createApp', 'get', 'manager'] as const)(
        'discards raw and forged CommandError failures from %s',
        async (stage) => {
          for (const error of [
            new Error(sensitiveExcerpt, {
              cause: new Error('nested-private-cause'),
            }),
            new CommandError(sensitiveExcerpt, {
              // Even the same code as a trusted validation failure must not bypass the identity boundary.
              code: 'AI_LLM_API_KEY_MISSING',
              details: services.primary.options,
              suggestions: [sensitiveExcerpt],
              cause: new Error('nested-private-cause'),
              exit: 9,
            }),
          ]) {
            const fixture = bind(command);
            const fail = () => {
              throw error;
            };
            if (stage === 'loadRuntime')
              fixture.loadRuntime.mockImplementation(fail);
            else if (stage === 'createApp')
              fixture.createApp.mockImplementation((runtime) => {
                runtime.app = fixture.app;
                throw error;
              });
            else if (stage === 'get') fixture.get.mockImplementation(fail);
            else provider.createManager.mockImplementation(fail);
            const run = await runAppCommand(fixture.Bound, [...args, ...flags]);
            expect(run.exitCode).toBe(1);
            if (json)
              expect(run.json()).toMatchObject({
                ok: false,
                error: {
                  code: 'AI_LLM_INITIALIZATION_FAILED',
                  suggestions: [
                    {
                      run: {
                        command: 'pnpm',
                        args: [
                          'nocobase',
                          'config',
                          'check',
                          '--no-connect',
                          '--json',
                        ],
                      },
                    },
                  ],
                },
              });
            else
              expect(run.error).toMatchObject({
                errorCode: 'AI_LLM_INITIALIZATION_FAILED',
                details: undefined,
              });
            expectConfidential(run);
            expect(fixture.start).not.toHaveBeenCalled();
            expect(fixture.registerProviders).not.toHaveBeenCalled();
            expect(fixture.resolve).not.toHaveBeenCalled();
            expect(fixture.shutdown).toHaveBeenCalledTimes(
              stage === 'loadRuntime' ? 0 : 1,
            );
            expect(fixture.destroy).toHaveBeenCalledTimes(
              stage === 'loadRuntime' ? 0 : 1,
            );
          }
        },
      );

      it('never inspects an arbitrary thrown configuration object', async () => {
        const inspect = vi.fn(() => {
          throw new Error('must not inspect');
        });
        const fixture = bind(command);
        fixture.get.mockImplementation(() => {
          throw {
            get message() {
              return inspect();
            },
            toString: inspect,
            secret,
          };
        });
        const run = await runAppCommand(fixture.Bound, [...args, ...flags]);
        expect(run.exitCode).toBe(1);
        expect(inspect).not.toHaveBeenCalled();
        expectConfidential(run);
      });

      it.each(['shutdown', 'destroy', 'both'] as const)(
        'sanitizes %s warnings without replacing successful or failed work',
        async (stage) => {
          for (const outcome of [
            'success',
            'missing-key',
            'provider-failure',
            'create-failure',
          ] as const) {
            const fixture = bind(
              command,
              outcome === 'missing-key'
                ? { llmServices: { primary: { provider: 'openai' } } }
                : { llmServices: services },
            );
            if (stage !== 'destroy')
              fixture.shutdown.mockRejectedValue(new Error(sensitiveExcerpt));
            if (stage !== 'shutdown')
              fixture.destroy.mockRejectedValue(new Error(sensitiveExcerpt));
            if (outcome === 'provider-failure')
              provider.construct.mockImplementation(() => {
                throw new Error(sensitiveExcerpt);
              });
            if (outcome === 'create-failure')
              fixture.createApp.mockImplementation((runtime) => {
                runtime.app = fixture.app;
                throw new Error(sensitiveExcerpt);
              });
            const run = await runAppCommand(fixture.Bound, [...args, ...flags]);
            const code =
              outcome === 'missing-key'
                ? 'AI_LLM_API_KEY_MISSING'
                : outcome === 'provider-failure'
                  ? 'AI_LLM_PROVIDER_FAILED'
                  : 'AI_LLM_INITIALIZATION_FAILED';
            expect(run.exitCode).toBe(outcome === 'success' ? undefined : 1);
            if (json)
              expect(run.json()).toMatchObject({
                ok: outcome === 'success',
                warnings: [cleanupWarning],
                ...(outcome === 'success' ? {} : { error: { code } }),
              });
            else {
              expect(
                run.stderr.replaceAll('›', '').replace(/\s+/g, ' '),
              ).toContain(cleanupWarning);
              if (outcome !== 'success')
                expect(run.error).toMatchObject({ errorCode: code });
            }
            expectConfidential(run);
            expect(fixture.shutdown).toHaveBeenCalledOnce();
            expect(fixture.destroy).toHaveBeenCalledOnce();
            provider.construct.mockReset();
          }
        },
      );

      it.each([
        { ai: { llmServices: [] }, code: 'AI_LLM_CONFIG_INVALID' },
        { ai: {}, code: 'AI_LLM_SERVICE_NOT_FOUND' },
        {
          ai: { llmServices: { primary: { provider: 'openai' } } },
          code: 'AI_LLM_API_KEY_MISSING',
        },
        {
          ai: { llmServices: { primary: { provider: 'custom' } } },
          code: 'AI_LLM_PROVIDER_UNSUPPORTED',
        },
      ])(
        'preserves trusted $code errors and their repair guidance',
        async ({ ai, code }) => {
          const fixture = bind(command, ai);
          const run = await runAppCommand(fixture.Bound, [...args, ...flags]);
          expect(run.exitCode).toBe(1);
          if (json)
            expect(run.json()).toMatchObject({
              ok: false,
              error: { code, suggestions: expect.any(Array) },
            });
          else
            expect(run.error).toMatchObject({
              errorCode: code,
              commandSuggestions: expect.any(Array),
            });
          if (code === 'AI_LLM_CONFIG_INVALID') {
            const details = {
              issues: [{ path: 'llmServices', message: expect.any(String) }],
            };
            if (json) expect(run.json()).toMatchObject({ error: { details } });
            else expect(run.error).toMatchObject({ details });
          }
          expectConfidential(run);
          expectNoStartup(fixture);
        },
      );
    });

    it.each([
      { command: 'pnpm', args: ['nocobase'] },
      { command: 'node', args: ['/synthetic deployment/dist/cli/index.js'] },
    ])(
      'renders actionable guidance for $command without executable placeholders',
      async (invocation) => {
        const fixture = bind(
          command,
          { llmServices: { primary: { provider: 'openai' } } },
          invocation,
        );
        const run = await runAppCommand(fixture.Bound, [...args, '--json']);
        const suggestions = (
          run.json() as {
            error: {
              suggestions: {
                message: string;
                run?: { command: string; args: string[] };
              }[];
            };
          }
        ).error.suggestions;
        expect(suggestions[0]).toEqual({
          message: expect.stringContaining(
            "config set --from-env 'ai.llmServices.primary.options.apiKey=<VARIABLE>'",
          ),
        });
        expect(suggestions[0]!.message).toContain(
          invocation.command === 'node'
            ? "node '/synthetic deployment/dist/cli/index.js'"
            : 'pnpm nocobase',
        );
        expect(suggestions[1]!.run).toEqual({
          command: invocation.command,
          args: [
            ...invocation.args,
            'config',
            'check',
            '--no-connect',
            '--json',
          ],
        });
        provider.construct.mockImplementation(() => {
          throw new Error(sensitiveExcerpt);
        });
        const failed = await runAppCommand(
          bind(command, { llmServices: services }, invocation).Bound,
          [...args, '--json'],
        );
        expect(failed.json()).toMatchObject({
          error: {
            code: 'AI_LLM_PROVIDER_FAILED',
            suggestions: expect.arrayContaining([
              {
                message: expect.any(String),
                run: {
                  command: invocation.command,
                  args: [
                    ...invocation.args,
                    'config',
                    'check',
                    '--no-connect',
                    '--json',
                  ],
                },
              },
            ]),
          },
        });
      },
    );
  },
);

describe('provider error confidentiality', () => {
  const leak = `${secret} https://user:pass@example.test/v1?arbitrary=private-query&other=encoded%2Fsecret Authorization: Bearer private-header X-Custom: private-custom-header`;
  it.each([
    'constructor',
    'models-thrown',
    'models-returned',
    'completion',
  ] as const)(
    'discards %s failures, including arbitrary secrets, URL queries, headers and causes in debug mode',
    async (failure) => {
      vi.stubEnv('NOCOBASE_CLI_DEBUG', '1');
      const error = Object.assign(
        new Error(leak, { cause: new Error('nested-private-cause') }),
        {
          headers: { Authorization: secret },
          config: { options: services.primary.options },
        },
      );
      if (failure === 'constructor')
        provider.construct.mockImplementation(() => {
          throw error;
        });
      if (failure === 'models-thrown')
        provider.listModels.mockRejectedValue(error);
      if (failure === 'models-returned')
        provider.listModels.mockResolvedValue({ code: 401, errMsg: leak });
      if (failure === 'completion') provider.invoke.mockRejectedValue(error);
      const command = failure === 'completion' ? LLMTest : LLMModels;
      const args =
        command === LLMTest
          ? ['primary', '--model', 'explicit-model']
          : ['primary'];
      for (const json of [false, true]) {
        const fixture = bind(command);
        const run = await runAppCommand(fixture.Bound, [
          ...args,
          ...(json ? ['--json'] : []),
        ]);
        expect(run.exitCode).toBe(1);
        const printed = run.stdout + run.stderr + String(run.error);
        for (const value of [
          secret,
          'private-query',
          'encoded%2Fsecret',
          'private-header',
          'private-custom-header',
          'nested-private-cause',
          'https://user:pass',
          'Authorization',
        ]) {
          expect(printed).not.toContain(value);
        }
        if (json) {
          expect(run.json()).toMatchObject({
            ok: false,
            error: {
              code: 'AI_LLM_PROVIDER_FAILED',
              message: 'The LLM provider request failed.',
            },
          });
        } else {
          expect(run.error).toBeInstanceOf(CommandError);
          expect(run.error).toMatchObject({
            underlyingError: undefined,
            details: undefined,
          });
        }
        expectNoStartup(fixture);
      }
    },
  );

  it('does not serialize or inspect a thrown provider object', async () => {
    const toString = vi.fn(() => {
      throw new Error('must not inspect');
    });
    provider.listModels.mockRejectedValue({ toString, secret });
    const { Bound } = bind(LLMModels);
    const run = await runAppCommand(Bound, ['primary', '--json']);
    expect(run.json()).toMatchObject({
      ok: false,
      error: { code: 'AI_LLM_PROVIDER_FAILED' },
    });
    expect(toString).not.toHaveBeenCalled();
  });
});
