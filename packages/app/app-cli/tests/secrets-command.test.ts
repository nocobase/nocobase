import {
  createSecretsService,
  secretsServiceToken,
  type SecretsService,
  type SecretsStore,
} from '@nocobase/app-server/secrets';
import { ServiceContainer } from '../../../libs/service-provider/src/index.ts';
import { describe, expect, it } from 'vitest';

import SecretsRotate from '../src/commands/secrets/rotate.ts';
import SecretsStatus from '../src/commands/secrets/status.ts';
import type { AppCommandRuntime } from '../src/context.ts';
import { bindAppCommand } from './app-command.ts';
import { runAppCommand } from './command-output.ts';

const v1 = { version: 1, key: '1'.repeat(64) };
const v2 = { version: 2, key: '2'.repeat(64) };

/** A store over an in-memory list, sealed for one purpose, with an optional value no key opens. */
function memoryStore(
  name: string,
  values: string[],
  { broken = 0 }: { broken?: number } = {},
): SecretsStore {
  const purpose = name;
  const statusOf = (secrets: SecretsService) => {
    const byVersion: Record<string, number> = {};
    let needsReseal = broken;
    for (const value of values) {
      const version = String(secrets.inspect(value).version);
      byVersion[version] = (byVersion[version] ?? 0) + 1;
      if (secrets.needsReseal(value)) needsReseal += 1;
    }
    return { total: values.length + broken, byVersion, needsReseal };
  };
  return {
    name,
    status: async ({ secrets }) => statusOf(secrets),
    async reseal({ secrets, dryRun }) {
      let resealed = 0;
      values.forEach((value, index) => {
        if (!secrets.needsReseal(value)) return;
        const plain = secrets.open(value, { purpose });
        if (!dryRun) values[index] = secrets.seal(plain, { purpose });
        resealed += 1;
      });
      return { resealed, failed: broken };
    },
  };
}

function bind(
  command: typeof SecretsStatus | typeof SecretsRotate,
  secrets: SecretsService | undefined,
) {
  const container = new ServiceContainer();
  if (secrets) container.instance(secretsServiceToken, secrets);
  let shutdown = false;
  const bound = bindAppCommand(command, {
    rootDir: process.cwd(),
    loadRuntime: async () =>
      ({
        env: {},
        scope: { destroy: async () => {} },
      }) as unknown as AppCommandRuntime,
    createApp: async () =>
      ({
        container,
        registerProviders() {},
        async shutdown() {
          shutdown = true;
        },
      }) as never,
  });
  return { bound, shutdown: () => shutdown };
}

function sealedUnder(keys: (typeof v1)[], purpose: string, count: number) {
  const secrets = createSecretsService({ keys });
  return Array.from({ length: count }, (_, index) =>
    secrets.seal(`value-${index}`, { purpose }),
  );
}

describe('secrets status', () => {
  it('reports each store by key version', async () => {
    const secrets = createSecretsService({ keys: [v2, v1] });
    secrets.registerStore(
      memoryStore('vars', [
        ...sealedUnder([v1], 'vars', 2),
        ...sealedUnder([v2], 'vars', 1),
      ]),
    );
    const { bound, shutdown } = bind(SecretsStatus, secrets);

    const output = await runAppCommand(bound, ['--json']);

    expect(output.json()).toMatchObject({
      ok: true,
      status: 'success',
      result: {
        currentVersion: 2,
        needsReseal: 2,
        stores: [
          {
            name: 'vars',
            total: 3,
            byVersion: { '1': 2, '2': 1 },
            needsReseal: 2,
          },
        ],
      },
    });
    expect(shutdown()).toBe(true);
  });

  it('fails with SECRETS_NOT_CONFIGURED without keys', async () => {
    const { bound } = bind(SecretsStatus, createSecretsService({ keys: [] }));

    const output = await runAppCommand(bound, ['--json']);

    expect(output.exitCode).toBe(1);
    expect(output.json()).toMatchObject({
      ok: false,
      error: {
        code: 'SECRETS_NOT_CONFIGURED',
        message: expect.stringContaining('secrets.keys'),
      },
    });
  });

  it('fails with SECRETS_UNAVAILABLE when the application registers no service', async () => {
    const { bound } = bind(SecretsStatus, undefined);

    expect((await runAppCommand(bound, ['--json'])).json()).toMatchObject({
      error: { code: 'SECRETS_UNAVAILABLE' },
    });
  });
});

describe('secrets rotate', () => {
  it('previews with --dry-run, reseals, then changes nothing', async () => {
    const secrets = createSecretsService({ keys: [v2, v1] });
    const values = sealedUnder([v1], 'vars', 3);
    secrets.registerStore(memoryStore('vars', values));
    const { bound } = bind(SecretsRotate, secrets);

    const preview = (
      await runAppCommand(bound, ['--dry-run', '--json'])
    ).json();
    expect(preview).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: {
        dryRun: true,
        resealed: 3,
        stores: [{ name: 'vars', resealed: 3, needsReseal: 3 }],
      },
    });

    const run = (await runAppCommand(bound, ['--json'])).json();
    expect(run).toMatchObject({
      status: 'success',
      result: { dryRun: false, resealed: 3, failed: 0 },
    });
    expect(values.every((value) => !secrets.needsReseal(value))).toBe(true);

    expect((await runAppCommand(bound, ['--json'])).json()).toMatchObject({
      status: 'success-noop',
      result: { resealed: 0 },
    });
  });

  it('fails with SECRETS_RESEAL_FAILED when a value cannot be opened', async () => {
    const secrets = createSecretsService({ keys: [v2] });
    secrets.registerStore(memoryStore('vars', [], { broken: 1 }));
    const { bound } = bind(SecretsRotate, secrets);

    const output = await runAppCommand(bound, ['--json']);

    expect(output.exitCode).toBe(1);
    expect(output.json()).toMatchObject({
      ok: false,
      error: {
        code: 'SECRETS_RESEAL_FAILED',
        details: { failed: 1 },
      },
    });
  });
});
