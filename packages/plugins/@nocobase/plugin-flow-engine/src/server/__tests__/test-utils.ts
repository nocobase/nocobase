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
import { createMockServer, type MockServerOptions } from '@nocobase/test';
import { variables, registerBuiltInVariables } from '../variables/registry';

function shouldUseEnvDatabase() {
  return ['postgres', 'mysql', 'mariadb'].includes(String(process.env.DB_DIALECT || '').toLowerCase());
}

export function createFlowEngineMockServer(options: MockServerOptions = {}) {
  const { database, ...restOptions } = options;
  const databaseOptions = isRecord(database) ? database : {};
  const defaultDatabaseOptions = shouldUseEnvDatabase()
    ? {}
    : {
        dialect: 'sqlite',
        storage: ':memory:',
        // CI postgres jobs set DB_SCHEMA; SQLite cannot create schemas.
        schema: undefined,
      };

  return createMockServer({
    skipSupervisor: true,
    ...restOptions,
    database: {
      ...defaultDatabaseOptions,
      ...databaseOptions,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 重置变量注册表：
 * - 清空所有已注册的变量定义
 * - 恢复内置变量
 */
export function resetVariablesRegistryForTest() {
  const reg: any = variables as any;
  // 清空已注册变量
  if (reg && reg.vars && typeof reg.vars.clear === 'function') {
    reg.vars.clear();
  }

  registerBuiltInVariables(variables);
}
