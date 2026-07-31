/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createRequire } from 'node:module';

export type RunJSCompilerModule = typeof import('./index');

export { inspectRunJSSourceCode } from './source-inspection';

let compilerModule: Promise<RunJSCompilerModule> | undefined;
const requireCompiler = createRequire(__filename);

export function loadRunJSCompiler(): Promise<RunJSCompilerModule> {
  return (compilerModule ||= import('./index.js').catch((error: unknown) => {
    if (!__filename.endsWith('.ts') || !isModuleNotFoundError(error)) {
      throw error;
    }
    return requireCompiler('./index') as RunJSCompilerModule;
  }));
}

function isModuleNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND';
}
