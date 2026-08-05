/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JSRunnerOptions } from '../JSRunner';

export type RunJSExecutionResult<T = unknown> = {
  success: boolean;
  value?: T;
  error?: unknown;
  timeout?: boolean;
};

type RunJSCompatibleContext<T> = {
  runjs?: (
    code: string,
    variables?: Record<string, unknown>,
    options?: JSRunnerOptions,
  ) => Promise<RunJSExecutionResult<T>>;
};

/**
 * @deprecated Browser globals are now provided by FlowContext. Use `ctx.runjs()` directly.
 */
export async function runjsWithSafeGlobals<T = unknown>(
  ctx: unknown,
  code: string,
  options?: JSRunnerOptions,
  extraGlobals?: Record<string, unknown>,
): Promise<RunJSExecutionResult<T> | undefined> {
  if (!ctx || (typeof ctx !== 'object' && typeof ctx !== 'function')) {
    return undefined;
  }

  const runjs = (ctx as RunJSCompatibleContext<T>).runjs;
  if (typeof runjs !== 'function') {
    return undefined;
  }

  return runjs.call(ctx, code, extraGlobals, options);
}
