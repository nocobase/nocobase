/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, type FlowModel } from '@nocobase/flow-engine';
import { vi } from 'vitest';

import type { RunJSSourceSettingsDescriptor } from '../../../components/runjs-source';

export const JS_ACTION_SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_actions',
  entryId: 'entry_mark_approved',
  entryPath: 'src/client/js-actions/mark-approved/index.ts',
  kind: 'js-action',
};

export const JS_ACTION_SETTINGS_DESCRIPTOR: RunJSSourceSettingsDescriptor = {
  schemaHash: 'schema_action',
  defaults: {
    successMessage: 'Approved',
  },
  schema: {
    type: 'object',
    properties: {
      successMessage: {
        type: 'string',
        title: 'Success message',
      },
    },
  },
};

export type ActionTestMessage = {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  warning: ReturnType<typeof vi.fn>;
};

export function createActionRunJsParams(input: Record<string, unknown> = {}) {
  return {
    version: 'v2',
    sourceMode: 'light-extension',
    sourceBinding: JS_ACTION_SOURCE_BINDING,
    settings: {
      successMessage: 'Approved',
    },
    code: 'ctx.message.info("inline action");',
    ...input,
  };
}

export function createActionModel<TModel extends FlowModel>(input: {
  ModelClass: typeof FlowModel;
  use: string;
  uid: string;
  runJs?: Record<string, unknown>;
}) {
  const engine = new FlowEngine();
  engine.registerModels({
    [input.use]: input.ModelClass,
  });
  const model = engine.createModel<TModel>({
    use: input.use,
    uid: input.uid,
    props: {
      loading: false,
    },
    stepParams: {
      clickSettings: {
        runJs: input.runJs || createActionRunJsParams(),
      },
    },
  });
  const state: Record<string, unknown> = {};
  const message: ActionTestMessage = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };
  model.context.defineProperty('__testState', {
    value: state,
  });
  model.context.defineProperty('message', {
    value: message,
  });
  return {
    engine,
    model,
    state,
    message,
  };
}
