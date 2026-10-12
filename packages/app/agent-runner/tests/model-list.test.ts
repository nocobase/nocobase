// What a runner reports as each coding tool's models: the detected list, or a built-in one for a tool that cannot list
// them, with the owner's additions and removals (`config models`).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { builtInModels, reportedModels } from '../src/core/model-list.ts';
import { modelListOverrides } from '../src/lib/config.ts';
import { cli, cliEnv, removeDir, tempDir } from './helpers.ts';

describe('reported models', () => {
  it('reports the built-in list, without aliases, for a signed-in tool that cannot list its models', () => {
    const reported = reportedModels(
      {
        kind: 'claude',
        authenticated: true,
        modelsDetectionStatus: 'unsupported',
      },
      undefined,
    );
    expect(reported.modelsSource).toBe('builtin');
    const ids = reported.models?.map((model) => model.id) ?? [];
    expect(ids).toContain('claude-opus-5-5');
    expect(ids).not.toContain('opus');
    expect(ids).toEqual(builtInModels('claude').map((model) => model.id));
  });

  it('reports nothing for a tool that is not signed in, not detected yet, or whose detection failed', () => {
    const signedOut = {
      kind: 'codex' as const,
      authenticated: false,
      modelsDetectionStatus: 'unsupported' as const,
    };
    expect(reportedModels(signedOut, undefined).models).toBeUndefined();
    const pending = { kind: 'codex' as const, authenticated: true };
    expect(reportedModels(pending, { add: ['x'] })).toEqual(pending);
    const failed = {
      kind: 'codex' as const,
      authenticated: true,
      modelsDetectionStatus: 'failed' as const,
      modelsDetectionError: 'Model detection failed' as const,
    };
    expect(reportedModels(failed, { add: ['gpt-6-luna'] })).toEqual(failed);
  });

  it("applies the owner's additions and removals on top of a detected list", () => {
    const reported = reportedModels(
      {
        kind: 'opencode',
        authenticated: true,
        modelsDetectionStatus: 'detected',
        models: [
          { id: 'anthropic/claude-sonnet-5', efforts: ['high'] },
          { id: 'openai/gpt-6-luna' },
        ],
      },
      { add: ['moonshot/kimi-k2'], remove: ['openai/gpt-6-luna'] },
    );
    expect(reported.modelsSource).toBe('detected');
    expect(reported.models).toEqual([
      { id: 'anthropic/claude-sonnet-5', efforts: ['high'] },
      { id: 'moonshot/kimi-k2' },
    ]);
  });

  it('keeps only valid stored changes', () => {
    expect(
      modelListOverrides({
        codex: { add: ['gpt-6.1-sol', 'bad id', 7], remove: [] },
        nope: { add: ['x'] },
        pi: { add: [], remove: [] },
      }),
    ).toEqual({ codex: { add: ['gpt-6.1-sol'], remove: [] } });
    expect(modelListOverrides('broken')).toEqual({});
  });
});

describe('config models', () => {
  let home: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    home = tempDir('nocobase-runner-models-home-');
    env = cliEnv(home);
  });
  afterEach(() => removeDir(home));

  const stored = () =>
    (
      JSON.parse(readFileSync(path.join(home, 'settings.json'), 'utf8')) as {
        models?: unknown;
      }
    ).models;

  it('adds, removes and resets a tool’s models in the settings', async () => {
    expect(
      (await cli(['config', 'models', 'pi', 'add', 'moonshot/kimi-k2'], env))
        .code,
    ).toBe(0);
    await cli(['config', 'models', 'pi', 'remove', 'openai/gpt-6-luna'], env);
    expect(stored()).toEqual({
      pi: { add: ['moonshot/kimi-k2'], remove: ['openai/gpt-6-luna'] },
    });
    await cli(['config', 'models', 'pi', 'remove', 'moonshot/kimi-k2'], env);
    expect(stored()).toEqual({
      pi: { add: [], remove: ['openai/gpt-6-luna', 'moonshot/kimi-k2'] },
    });
    const shown = await cli(['config', 'models', 'pi', 'show', '--json'], env);
    expect(JSON.parse(shown.stdout).result).toMatchObject({
      tool: 'pi',
      builtin: expect.arrayContaining(['openai/gpt-6.1-sol']),
    });
    await cli(['config', 'models', 'pi', 'reset'], env);
    expect(stored()).toBeUndefined();
    expect((await cli(['config', 'models', 'pi', 'add'], env)).code).not.toBe(
      0,
    );
    expect(
      (await cli(['config', 'models', 'nope', 'add', 'x'], env)).code,
    ).not.toBe(0);
  });
});
