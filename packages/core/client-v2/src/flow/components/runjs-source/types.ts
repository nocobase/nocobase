/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSValue } from '@nocobase/flow-engine';

export const INLINE_RUNJS_SOURCE_MODE = 'inline';

export type RunJSSourceMode = typeof INLINE_RUNJS_SOURCE_MODE | (string & {});
export type RunJSSourceBinding = Record<string, unknown>;
export type RunJSSourceSettings = Record<string, unknown>;
export type RunJSSourceContext = Record<string, unknown>;

export interface RuntimeRunJSInput {
  runJs?: RunJSValue | null;
  sourceMode?: RunJSSourceMode | null;
  sourceBinding?: RunJSSourceBinding | null;
  settings?: RunJSSourceSettings | null;
  context?: RunJSSourceContext;
}

export interface ResolveRunJSSourceBindingInput {
  sourceMode: RunJSSourceMode;
  sourceBinding?: RunJSSourceBinding | null;
  settings?: RunJSSourceSettings | null;
  context?: RunJSSourceContext;
}

export interface RunJSSourceResolverInput extends ResolveRunJSSourceBindingInput {
  sourceMode: string;
}

export interface RunJSSourceResolverResult {
  code: string;
  version?: string;
  sourceMap?: unknown;
  settings?: RunJSSourceSettings | null;
  context?: RunJSSourceContext;
}

export interface ResolvedRuntimeRunJS {
  code: string;
  version: string;
  sourceMode: string;
  sourceBinding?: RunJSSourceBinding;
  sourceMap?: unknown;
  settings: RunJSSourceSettings;
  context?: RunJSSourceContext;
}

export interface RunJSSourceResolver {
  sourceMode: RunJSSourceMode;
  resolve: (input: RunJSSourceResolverInput) => RunJSSourceResolverResult | Promise<RunJSSourceResolverResult>;
}

export type RunJSSourceResolverErrorCode =
  | 'RUNJS_SOURCE_MODE_REQUIRED'
  | 'RUNJS_SOURCE_RESOLVER_REQUIRED'
  | 'RUNJS_SOURCE_RESOLVER_NOT_FOUND'
  | 'RUNJS_SOURCE_BINDING_REQUIRED'
  | 'RUNJS_SOURCE_CODE_REQUIRED';

export class RunJSSourceResolverError extends Error {
  readonly code: RunJSSourceResolverErrorCode;
  readonly sourceMode?: string;

  constructor(message: string, options: { code: RunJSSourceResolverErrorCode; sourceMode?: string }) {
    super(message);
    this.name = 'RunJSSourceResolverError';
    this.code = options.code;
    this.sourceMode = options.sourceMode;
  }
}
