/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ParamObject, RunJSValue } from '@nocobase/flow-engine';

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

export interface RunJSSourceSettingsDescriptor {
  schema?: Record<string, unknown> | null;
  defaults?: Record<string, unknown>;
  schemaHash?: string;
}

export interface RunJSSourceMenuItem {
  key: string;
  label: string;
  children?: RunJSSourceMenuItem[];
  disabled?: boolean;
  searchText?: string;
  selected?: boolean;
  onSelect?: (input: RunJSSourceMenuSelectInput) => ParamObject | void | Promise<ParamObject | void>;
}

export interface RunJSSourceMenuInput extends RuntimeRunJSInput {
  kind?: string;
  t?: (key: string, options?: Record<string, unknown>) => string;
}

export interface RunJSSourceMenuSelectInput extends RunJSSourceMenuInput {
  params: ParamObject;
  defaultParams: ParamObject;
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
  getBindingTitle?: (input: RunJSSourceResolverInput) => string | undefined | Promise<string | undefined>;
  getSettingsDescriptor?: (
    input: RunJSSourceResolverInput,
  ) => RunJSSourceSettingsDescriptor | undefined | Promise<RunJSSourceSettingsDescriptor | undefined>;
  listSourceMenuItems?: (input: RunJSSourceMenuInput) => RunJSSourceMenuItem[] | Promise<RunJSSourceMenuItem[]>;
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
