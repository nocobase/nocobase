/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 测试工具：重置变量注册表到默认状态
 * 说明：避免在实现文件中暴露测试专用 API，这里通过测试侧工具完成清理与基础内置变量的恢复。
 */
import type { ResourcerContext } from '@nocobase/resourcer';
import { type MockServer, createMockServer } from '@nocobase/test';
import type { HttpRequestContext } from '../template/contexts';
import { variables, inferSelectsFromUsage } from '../variables/registry';

type CreateFlowEngineTestAppOptions = {
  plugins?: any[];
  registerSchemas?: (flowEnginePlugin: any, app: MockServer) => void;
};

/**
 * 重置变量注册表：
 * - 清空所有已注册的变量定义
 * - 恢复内置变量（当前仅内置 user）
 */
export function resetVariablesRegistryForTest() {
  const reg: any = variables as any;
  // 清空已注册变量
  if (reg && reg.vars && typeof reg.vars.clear === 'function') {
    reg.vars.clear();
  }

  // 恢复内置变量：user
  reg.register({
    name: 'user',
    scope: 'request',
    attach: (
      flowCtx: HttpRequestContext,
      koaCtx: ResourcerContext,
      _params?: unknown,
      usage?: Record<string, string[]>,
    ) => {
      const paths = usage?.['user'] || [];
      const { generatedAppends, generatedFields } = inferSelectsFromUsage(paths);
      flowCtx.defineProperty('user', {
        get: async () => {
          try {
            const uid = (koaCtx as any)?.auth?.user?.id;
            if (uid === undefined || uid === null) return undefined;
            const ds = (koaCtx as any).app.dataSourceManager.get('main');
            const cm = ds.collectionManager;
            const repo = cm.db.getRepository('users');
            const rec = await repo.findOne({
              filterByTk: uid,
              fields: generatedFields,
              appends: generatedAppends,
            });
            return rec ? rec.toJSON?.() : undefined;
          } catch (_) {
            return undefined;
          }
        },
        cache: true,
      });
    },
  });
}

export async function createFlowEngineTestApp(options: CreateFlowEngineTestAppOptions = {}) {
  const app = await createMockServer({
    registerActions: true,
    plugins: options.plugins || ['flow-engine'],
  });
  const flowEnginePlugin = app.pm.get('flow-engine') as any;
  options.registerSchemas?.(flowEnginePlugin, app);

  return {
    app,
    agent: app.agent(),
    flowEnginePlugin,
  };
}

export async function destroyTestApp(app?: MockServer | null) {
  if (app) {
    await app.destroy();
  }
}

export function expectPublicSchemaDocument(document: any) {
  expect(document).not.toHaveProperty('coverage');
  expect(document).not.toHaveProperty('skeleton');
  expect(document).not.toHaveProperty('examples');
}

export function clonePayload<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
