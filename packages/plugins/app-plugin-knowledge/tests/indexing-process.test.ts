// @vitest-environment node
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createAppTest } from '@nocobase/app-testing/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { expect, vi } from 'vitest';
import {
  knowledgeIndexingToken,
  knowledgeAccessToken,
  knowledgeToken,
} from '../server/tokens.js';
import { generationsRepo, targetOf } from '../server/indexing/store.js';
import { createStandaloneServer } from './fixtures/indexing-app/server/standalone.js';

function worker(
  configPath: string,
  generationId: string,
  mode: 'hold' | 'recover',
) {
  const cli = path.join(
    path.dirname(createRequire(import.meta.url).resolve('vitest/package.json')),
    'vitest.mjs',
  );
  const child = spawn(
    process.execPath,
    [
      cli,
      'run',
      'tests/fixtures/indexing-process.worker.test.ts',
      '--pool=threads',
      '--maxWorkers=1',
      '--disableConsoleIntercept',
    ],
    {
      cwd: path.resolve(import.meta.dirname, '..'),
      env: {
        ...process.env,
        NOCOBASE_TEST_DB_DIALECT: 'sqlite',
        KNOWLEDGE_INDEXING_PROCESS_CONFIG: configPath,
        KNOWLEDGE_INDEXING_PROCESS_GENERATION: generationId,
        KNOWLEDGE_INDEXING_PROCESS_MODE: mode,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout.on('data', (data) => {
    output += String(data);
  });
  child.stderr.on('data', (data) => {
    output += String(data);
  });
  let spawnError: Error | undefined;
  child.once('error', (error) => {
    spawnError = error;
  });
  // close follows drained stdout/stderr, including diagnostics from failed workers.
  const exit = new Promise<number | null>((resolve) => {
    child.once('close', resolve);
  });
  function waitFor(pattern: RegExp, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        child.stdout.off('data', check);
        child.stderr.off('data', check);
        child.off('close', check);
        child.off('error', check);
      };
      const fail = (reason: string) => {
        cleanup();
        reject(new Error(`Knowledge ${mode} worker ${reason}.\n${output}`));
      };
      const check = () => {
        if (pattern.test(output)) {
          cleanup();
          resolve();
        } else if (spawnError) {
          fail(`could not start: ${spawnError.message}`);
        } else if (child.exitCode !== null || child.signalCode !== null) {
          fail(
            `exited before ${pattern}: code=${child.exitCode}, signal=${child.signalCode}`,
          );
        }
      };
      const timer = setTimeout(
        () => fail(`timed out waiting for ${pattern}`),
        timeout,
      );
      child.stdout.on('data', check);
      child.stderr.on('data', check);
      child.once('close', check);
      child.once('error', check);
      check();
    });
  }
  return { child, exit, waitFor, output: () => output };
}
const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    knowledge: {
      indexing: {
        local: { name: 'Local', type: 'sqlite-vec', file: 'vectors.sqlite' },
      },
    },
  },
});
test(
  'recovers in a fresh process after SIGKILL during real Memory execution',
  // Each fresh Vitest process gets its own cold-import budget, not recovery time.
  { timeout: 180000 },
  async ({ app, testApp, connection }) => {
    const authorization = app.container.resolve(authorizationToken);
    const subject = { type: 'user', id: 'fixture-admin' };
    await authorization.permissionSets.assign({
      subject,
      permissionSet: 'root',
    });
    const context = authorization.for({ principal: subject, subjects: [] });
    app.container.singleton(knowledgeAccessToken, () => ({
      space: (space) => (space.scope === 'project' ? space : null),
      inherits: () => [],
      forReader: () => ({
        access: async () => ({
          read: true,
          propose: true,
          edit: true,
          manage: true,
        }),
      }),
      title: async () => null,
      names: async () => new Map(),
    }));
    const model = await app.container
      .resolve(agentsToken)
      .models.services.create({
        title: 'Deterministic',
        provider: 'openai-compatible',
        baseUrl: 'http://127.0.0.1:1/v1',
        apiKey: 'fixture-not-a-real-key',
        models: [
          { value: 'embed', label: 'Embed', kind: 'embedding', dimensions: 3 },
        ],
      });
    await app.container.resolve(knowledgeToken).docs.create(
      { kind: 'user', userId: 'fixture-admin' },
      {
        scope: 'project',
        scopeId: 'p1',
        title: 'Crash recovery',
        content: 'Durable document.',
      },
    );
    const executor = app.container
      .resolve(jobExecutorServiceToken)
      .getJobExecutor('@nocobase/app-plugin-knowledge');
    const add = vi
      .spyOn(executor, 'addJob')
      .mockRejectedValueOnce(new Error('Lost initial wake.'));
    const receipt = await app.container
      .resolve(knowledgeIndexingToken)
      .save(context, {
        requestId: randomUUID(),
        expectedRevision: '0',
        config: {
          version: 1,
          key: 'local',
          options: { embedding: { modelService: model.name, model: 'embed' } },
        },
        acknowledgeFullRebuild: true,
      });
    add.mockRestore();
    const generation = await generationsRepo(connection).findOne({
      filter: { id: receipt.generationId! },
    });
    await generationsRepo(connection).updateMany({
      filter: { id: generation!.id },
      values: {
        target: {
          ...targetOf(generation!),
          lifecycle: {
            ...targetOf(generation!).lifecycle,
            lastDispatchedAt: '2000-01-01T00:00:00.000Z',
          },
        },
      },
    });
    await testApp.server.close();
    const held = worker(testApp.config.path, receipt.generationId!, 'hold');
    try {
      await held.waitFor(/^KB_PROCESS_WORKER_READY$/m, 60000);
      await held.waitFor(/^KB_PROCESS_EMBEDDING_STARTED$/m, 15000);
    } finally {
      held.child.kill('SIGKILL');
      await held.exit;
    }
    const recovered = worker(
      testApp.config.path,
      receipt.generationId!,
      'recover',
    );
    try {
      await recovered.waitFor(/^KB_PROCESS_WORKER_READY$/m, 60000);
      await recovered.waitFor(/^KB_PROCESS_RECOVERY_VERIFIED$/m, 30000);
      await expect
        .poll(() => recovered.child.exitCode, { timeout: 15000 })
        .not.toBeNull();
      const code = await recovered.exit;
      expect(recovered.output()).toMatch(/^KB_PROCESS_RECOVERY_VERIFIED$/m);
      expect(code).toBe(0);
    } finally {
      if (recovered.child.exitCode === null) recovered.child.kill('SIGKILL');
      await recovered.exit;
    }
  },
);
