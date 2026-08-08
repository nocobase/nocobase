/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import type { Database } from '@nocobase/database';
import { sha256Hex } from '@nocobase/runjs/server';
import { getOrCreateRunJSWorkspaceServerModule } from '@nocobase/runjs-workspace/server';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { vi } from 'vitest';

import { NAMESPACE } from '../../constants';
import {
  JS_TEMPLATE_AUTHORING_SURFACES,
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY,
  type JsTemplateCompileJob,
} from '../services/JsTemplateCompileContract';
import { buildJsTemplateCompileKey } from '../services/JsTemplateCompileKey';
import { JsTemplateCompileWorkerPool } from '../services/JsTemplateCompileWorkerPool';
import PluginJsTemplateServer from '../plugin';

describe('plugin-js-template bootstrap', () => {
  it('keeps the RunJS compiler unloaded until the first compile', () => {
    const serverEntryUrl = pathToFileURL(path.resolve(__dirname, '../index.ts')).href;
    expect(() =>
      execFileSync(
        process.execPath,
        [
          '--import',
          'tsx',
          '--input-type=module',
          '--eval',
          `
            import { createRequire } from 'node:module';
            const require = createRequire(import.meta.url);
            await import(${JSON.stringify(serverEntryUrl)});
            const loaded = Object.keys(require.cache).some((file) =>
              /\\/packages\\/core\\/runjs\\/(?:src|lib)\\/compiler\\/index\\.[cm]?[jt]s$/u.test(file),
            );
            if (loaded) process.exit(1);
          `,
        ],
        { cwd: process.cwd(), stdio: 'pipe' },
      ),
    ).not.toThrow();
  }, 20_000);

  it('hosts VSC capabilities and recovers Push before Pull with stable listeners across reloads', async () => {
    const afterStartListeners = new Set<() => Promise<void>>();
    const defineResource = vi.fn();
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: { allow: vi.fn(), registerSnippet: vi.fn() },
      resourceManager: { define: defineResource, options: {} },
      auditManager: {
        registerActions: vi.fn(),
        log: vi.fn(),
      },
      use: vi.fn(),
      on: vi.fn((eventName: string, listener: () => Promise<void>) => {
        if (eventName === 'afterStart') {
          afterStartListeners.add(listener);
        }
      }),
      off: vi.fn((eventName: string, listener: () => Promise<void>) => {
        if (eventName === 'afterStart') {
          afterStartListeners.delete(listener);
        }
      }),
    } as unknown as Application;
    const plugin = new PluginJsTemplateServer(app, {
      name: 'js-template',
      packageName: NAMESPACE,
    });
    getOrCreateRunJSWorkspaceServerModule(app, app.db);
    await plugin.load();
    expect(afterStartListeners).toHaveLength(2);
    await plugin.load();
    expect(afterStartListeners).toHaveLength(2);
    const order: string[] = [];
    const runtime = plugin.getRemoteSyncRuntime();
    vi.spyOn(runtime, 'recoverPushJobs').mockImplementation(async () => {
      order.push('push');
    });
    const listRecoverablePullJobs = vi
      .spyOn(runtime.getPullCoordinator(), 'listRecoverablePullJobs')
      .mockImplementation(async () => {
        order.push('pull');
        return [];
      });

    await plugin.afterEnable();
    expect(listRecoverablePullJobs).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['push', 'pull']);
    await Promise.all([...afterStartListeners].map((listener) => listener()));
    expect(listRecoverablePullJobs).toHaveBeenCalledTimes(2);
    expect(order).toEqual(['push', 'pull', 'push', 'pull']);

    await plugin.afterDisable();
    expect(afterStartListeners).toHaveLength(0);
    expect(() => plugin.getRemoteSyncRuntime()).toThrow('Remote sync runtime is not loaded');
  });

  it('rebuilds lazy compile infrastructure and keeps stable shutdown listeners across reloads', async () => {
    const beforeStopListeners = new Set<() => Promise<void>>();
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: { allow: vi.fn(), registerSnippet: vi.fn() },
      resourceManager: { define: vi.fn(), options: {} },
      auditManager: { registerActions: vi.fn(), log: vi.fn() },
      use: vi.fn(),
      on: vi.fn((eventName: string, listener: () => Promise<void>) => {
        if (eventName === 'beforeStop') {
          beforeStopListeners.add(listener);
        }
      }),
      off: vi.fn((eventName: string, listener: () => Promise<void>) => {
        if (eventName === 'beforeStop') {
          beforeStopListeners.delete(listener);
        }
      }),
    } as unknown as Application;
    const plugin = new PluginJsTemplateServer(app, {
      name: 'js-template',
      packageName: NAMESPACE,
    });
    getOrCreateRunJSWorkspaceServerModule(app, app.db);
    const infrastructure = () =>
      plugin as unknown as {
        compileWorkerPool?: JsTemplateCompileWorkerPool;
        runtimeCompileService?: { compileExecutor?: unknown };
      };
    const prepareRecovery = () => {
      const runtime = plugin.getRemoteSyncRuntime();
      vi.spyOn(runtime, 'recoverPushJobs').mockResolvedValue();
      vi.spyOn(runtime.getPullCoordinator(), 'listRecoverablePullJobs').mockResolvedValue([]);
    };

    await plugin.load();
    const firstPool = infrastructure().compileWorkerPool;
    expect(firstPool?.getMetrics().workerCount).toBe(0);
    expect(infrastructure().runtimeCompileService?.compileExecutor).toBe(firstPool);
    expect(beforeStopListeners).toHaveLength(2);

    await plugin.load();
    const secondPool = infrastructure().compileWorkerPool;
    expect(secondPool).not.toBe(firstPool);
    expect(firstPool?.getMetrics()).toMatchObject({ workerCount: 0, shuttingDown: true });
    expect(secondPool?.getMetrics().workerCount).toBe(0);
    expect(infrastructure().runtimeCompileService?.compileExecutor).toBe(secondPool);
    expect(beforeStopListeners).toHaveLength(2);

    await plugin.afterDisable();
    expect(secondPool?.getMetrics()).toMatchObject({ workerCount: 0, shuttingDown: true });
    expect(infrastructure().compileWorkerPool).toBeUndefined();
    expect(beforeStopListeners).toHaveLength(0);

    await plugin.load();
    prepareRecovery();
    await plugin.afterEnable();
    const thirdPool = infrastructure().compileWorkerPool;
    if (!thirdPool) {
      throw new Error('Expected compile worker pool after reload');
    }
    expect(thirdPool.getMetrics().workerCount).toBe(0);
    await expect(thirdPool.submit(createCompileJob(1))).resolves.toMatchObject({ accepted: true });
    expect(thirdPool.getMetrics().workerCount).toBe(1);
    await plugin.afterDisable();
    expect(thirdPool?.getMetrics()).toMatchObject({ workerCount: 0, shuttingDown: true });

    await plugin.load();
    prepareRecovery();
    await plugin.afterEnable();
    const fourthPool = infrastructure().compileWorkerPool;
    if (!fourthPool) {
      throw new Error('Expected compile worker pool after second reload');
    }
    await expect(fourthPool.submit(createCompileJob(2))).resolves.toMatchObject({ accepted: true });
    expect(beforeStopListeners).toHaveLength(2);
    await Promise.all([...beforeStopListeners].map((listener) => listener()));
    expect(fourthPool?.getMetrics()).toMatchObject({ workerCount: 0, shuttingDown: true });
    expect(infrastructure().compileWorkerPool).toBeUndefined();
    expect(beforeStopListeners).toHaveLength(0);
  }, 60_000);
});

function createCompileJob(ordinal: number): JsTemplateCompileJob {
  const templateName = `template-${ordinal}`;
  const entryPath = `src/client/js-blocks/${templateName}/index.tsx`;
  const content = `ctx.render(<div>${ordinal}</div>);\n`;
  const files = [
    {
      path: entryPath,
      content,
      blobHash: sha256Hex(content),
      language: 'tsx',
      mode: '100644',
    },
  ];
  const key = buildJsTemplateCompileKey({
    template: {
      target: 'client',
      kind: 'js-block',
      entryPath,
      descriptorPath: `src/client/js-blocks/${templateName}/entry.json`,
    },
    files,
  });
  return {
    jobId: `job-${ordinal}`,
    requestId: `request-${ordinal}`,
    correlationId: 'plugin-bootstrap',
    projectId: 'project-1',
    templateId: `template-id-${ordinal}`,
    templateName,
    ordinal,
    compileKey: key.compileKey,
    filesHash: key.filesHash,
    kind: 'js-block',
    entryPath,
    runtimeVersion: 'v2',
    surface: structuredClone(JS_TEMPLATE_AUTHORING_SURFACES['js-block']),
    compilerBuildIdentity: structuredClone(JS_TEMPLATE_COMPILER_BUILD_IDENTITY),
    inputManifest: key.inputManifest,
    files,
  };
}
