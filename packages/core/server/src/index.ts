/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from './aes-encryptor';
export * from './app-supervisor';
export * from './application';
export { Application as default } from './application';
export * from './audit-manager';
export * from './gateway';
export * as middlewares from './middlewares';
export * from './migration';
export * from './plugin';
export * from './plugin-manager';
export * from './pub-sub-manager';
export * from './event-queue';
export * from './background-job-manager';
export * from './worker-id-allocator';
export const OFFICIAL_PLUGIN_PREFIX = '@nocobase/plugin-';

export {
  appendToBuiltInPlugins,
  findAllPlugins,
  findBuiltInPlugins,
  findLocalPlugins,
  packageNameTrim,
} from './plugin-manager/findPackageNames';

export { runPluginStaticImports } from './run-plugin-static-imports';
