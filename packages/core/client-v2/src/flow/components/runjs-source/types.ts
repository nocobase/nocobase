/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ParamObject, RunJSValue } from '@nocobase/flow-engine';
import type { RunJSSourceMode } from '@nocobase/runjs/workspace/shared';

export {
  INLINE_RUNJS_SOURCE_MODE,
  RunJSSourceResolverError,
  type RunJSSourceResolverErrorCode,
} from '@nocobase/runjs/workspace/shared';
export type { RunJSSourceMode };
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
  entryId: string;
  settingsSchemaHash: string | null;
  schema?: Record<string, unknown> | null;
  defaults?: Record<string, unknown>;
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

export interface RunJSSourceMenuLabels {
  searchPlaceholder: string;
  loadingLabel: string;
  emptyLabel: string;
  errorLabel: string;
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
  getSourceMenuLabels?: () => Partial<RunJSSourceMenuLabels>;
  resolve: (input: RunJSSourceResolverInput) => RunJSSourceResolverResult | Promise<RunJSSourceResolverResult>;
  getBindingTitle?: (input: RunJSSourceResolverInput) => string | undefined | Promise<string | undefined>;
  getSettingsDescriptor?: (
    input: RunJSSourceResolverInput,
  ) => RunJSSourceSettingsDescriptor | undefined | Promise<RunJSSourceSettingsDescriptor | undefined>;
  listSourceMenuItems?: (input: RunJSSourceMenuInput) => RunJSSourceMenuItem[] | Promise<RunJSSourceMenuItem[]>;
}
