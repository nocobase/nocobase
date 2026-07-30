/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSCompilerModule = typeof import('./index');

export { inspectRunJSSourceCode } from './source-inspection';

let compilerModule: Promise<RunJSCompilerModule> | undefined;

export function loadRunJSCompiler(): Promise<RunJSCompilerModule> {
  return (compilerModule ||= import('./index.js'));
}
