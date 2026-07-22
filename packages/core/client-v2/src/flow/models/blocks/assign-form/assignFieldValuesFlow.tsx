/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowModelRenderer,
  isRunJSValue,
  normalizeRunJSValue,
  tExpr,
  type FlowModelContext,
  useFlowEngine,
  useFlowSettingsContext,
} from '@nocobase/flow-engine';
import React, { useEffect } from 'react';
import { CollectionActionModel } from '../../base/CollectionActionModel';
import { RecordActionModel } from '../../base/RecordActionModel';
import { AssignFormModel } from './AssignFormModel';
import { evaluateInlineRunJSValue } from '../../../components/runjs-source';

export const ASSIGN_FIELD_VALUES_STEP_KEY = 'assignFieldValues';

type AssignedValues = Record<string, unknown>;

type AssignFieldValuesCollection = {
  dataSourceKey?: string;
  name?: string;
};

type AssignFieldValuesContext = FlowModelContext & {
  collection?: AssignFieldValuesCollection;
  flowSettingsEnabled?: boolean;
};

type AssignFieldValuesModel = {
  uid: string;
  assignFormUid?: string;
  context?: AssignFieldValuesContext;
  subModels?: {
    assignForm?: AssignFormModel;
  };
  getStepParams?: (flowKey: string, stepKey: string) => { assignedValues?: AssignedValues } | undefined;
  setStepParams?: (flowKey: string, stepKey: string, params: { assignedValues: AssignedValues }) => void;
};

type AssignFieldValuesStepOptions = {
  settingsFlowKey: string;
  title?: string;
  tipComponent?: React.ComponentType;
  validateBeforeSave?: boolean;
  clearRecordContext?: boolean;
};

type ResolveAssignFieldValuesOptions = {
  settingsFlowKey?: string;
};

const SKIP_ASSIGN_VALUE = Symbol('SKIP_ASSIGN_VALUE');

function getContextCollection(ctx: AssignFieldValuesContext | undefined): AssignFieldValuesCollection | undefined {
  const collection = ctx?.collection;
  return collection && typeof collection === 'object' ? collection : undefined;
}

function getResourceInit(ctx: AssignFieldValuesContext): { dataSourceKey: string; collectionName: string } | undefined {
  const collection = getContextCollection(ctx);
  const dsKey = collection?.dataSourceKey;
  const collName = collection?.name;
  return dsKey && collName ? { dataSourceKey: dsKey, collectionName: collName } : undefined;
}

function resolveInitFromFlowSettings(
  blockModel: unknown,
  actionContext: AssignFieldValuesContext | undefined,
): { dataSourceKey: string; collectionName: string } | undefined {
  const maybeBlockCollection = (blockModel as { collection?: { dataSourceKey?: string; name?: string } } | undefined)
    ?.collection;
  const collection = maybeBlockCollection || getContextCollection(actionContext);
  const dsKey = collection?.dataSourceKey;
  const collName = collection?.name;
  return dsKey && collName ? { dataSourceKey: dsKey, collectionName: collName } : undefined;
}

function isValidResourceInit(init: unknown): init is {
  dataSourceKey: string;
  collectionName: string;
} {
  if (!init || typeof init !== 'object') return false;
  const obj = init as { dataSourceKey?: unknown; collectionName?: unknown };
  return (
    typeof obj.dataSourceKey === 'string' &&
    !!obj.dataSourceKey &&
    typeof obj.collectionName === 'string' &&
    !!obj.collectionName
  );
}

type LocalCacheContext = {
  _observableCache?: Record<string, unknown>;
  _cache?: Record<string, unknown>;
  _pending?: Record<string, unknown>;
};

function toLocalCacheContext(context: unknown): LocalCacheContext | undefined {
  return context && typeof context === 'object' ? (context as LocalCacheContext) : undefined;
}

function clearOwnContextCache(context: unknown, key: string) {
  const localContext = toLocalCacheContext(context);
  if (!localContext) {
    return;
  }
  delete localContext._observableCache?.[key];
  delete localContext._cache?.[key];
  delete localContext._pending?.[key];
}

function clearResourceContextCache(model: { context?: unknown } | undefined) {
  clearOwnContextCache(model?.context, 'dataSource');
  clearOwnContextCache(model?.context, 'collection');
  clearOwnContextCache(model?.context, 'resource');
  clearOwnContextCache(model?.context, 'association');
}

function resolveAssignFormModel(ctx: {
  model: AssignFieldValuesModel;
  engine: {
    getModel?: (uid: string, fromRoot?: boolean) => AssignFormModel | undefined;
    findModelByParentId?: (parentId: string, subKey: string) => AssignFormModel | undefined | null;
  };
}) {
  if (ctx.model.assignFormUid) {
    const form = ctx.engine.getModel?.(ctx.model.assignFormUid, true);
    if (form) {
      return form;
    }
  }

  const localForm = ctx.model.subModels?.assignForm;
  if (localForm) {
    return localForm;
  }

  return ctx.engine.findModelByParentId?.(ctx.model.uid, 'assignForm') || undefined;
}

export function createAssignFormSubModelOptions(ctx: AssignFieldValuesContext) {
  return {
    async: true,
    use: 'AssignFormModel',
    stepParams: { resourceSettings: { init: getResourceInit(ctx) } },
  };
}

export function getAssignFieldValuesDefaultParams(
  ctx: {
    model: Pick<AssignFieldValuesModel, 'getStepParams'>;
  },
  settingsFlowKey: string,
): { assignedValues: AssignedValues } {
  const step = ctx.model.getStepParams?.(settingsFlowKey, ASSIGN_FIELD_VALUES_STEP_KEY) || {};
  return { assignedValues: step?.assignedValues || {} };
}

export async function resolveAssignFieldValues(
  ctx: {
    message?: { error?: (message: string) => void };
    t?: (message: string) => string;
    model?: { uid?: string; use?: string };
  },
  rawAssignedValues: unknown,
  logName = 'AssignFieldValues',
  _options: ResolveAssignFieldValuesOptions = {},
): Promise<AssignedValues | null> {
  try {
    return await resolveAssignRunJSObjectValues(ctx, rawAssignedValues);
  } catch (error) {
    console.error(`[${logName}] RunJS execution failed`, error);
    ctx.message?.error?.(ctx.t?.('RunJS execution failed') || 'RunJS execution failed');
    return null;
  }
}

async function resolveAssignRunJSObjectValues(
  ctx: {
    model?: { uid?: string; use?: string };
  },
  rawAssignedValues: unknown,
): Promise<AssignedValues> {
  if (!rawAssignedValues || typeof rawAssignedValues !== 'object' || Array.isArray(rawAssignedValues)) {
    return {};
  }

  const output: AssignedValues = {};
  for (const [key, value] of Object.entries(rawAssignedValues)) {
    if (typeof value === 'undefined') {
      continue;
    }

    const resolved = await resolveAssignRunJSValue(ctx, value);
    if (resolved !== SKIP_ASSIGN_VALUE) {
      output[key] = resolved;
    }
  }

  return output;
}

async function resolveAssignRunJSValue(
  ctx: {
    model?: { uid?: string; use?: string };
  },
  value: unknown,
): Promise<unknown> {
  if (isRunJSValue(value)) {
    const normalized = normalizeRunJSValue(value);
    if (!normalized.code.trim()) {
      return SKIP_ASSIGN_VALUE;
    }
    const evaluated = await evaluateInlineRunJSValue({ ctx, runJs: normalized });
    return typeof evaluated === 'undefined' ? SKIP_ASSIGN_VALUE : evaluated;
  }

  return value;
}

export function mergeAssignFieldValues<T extends Record<string, unknown>>(
  values: T,
  assignedValues?: AssignedValues | null,
): T {
  if (!assignedValues || typeof assignedValues !== 'object' || !Object.keys(assignedValues).length) {
    return values;
  }
  return {
    ...values,
    ...assignedValues,
  } as T;
}

function AssignFieldsEditor(props: { settingsFlowKey: string; clearRecordContext?: boolean }) {
  const { model, blockModel } = useFlowSettingsContext();
  const action = model as AssignFieldValuesModel;
  const engine = useFlowEngine();
  const [formModel, setFormModel] = React.useState<AssignFormModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadAssignForm = async () => {
      const init = resolveInitFromFlowSettings(blockModel, action?.context);
      const loaded = (await engine.loadOrCreateModel(
        init
          ? {
              parentId: action.uid,
              subKey: 'assignForm',
              use: 'AssignFormModel',
              stepParams: { resourceSettings: { init } },
            }
          : {
              parentId: action.uid,
              subKey: 'assignForm',
              use: 'AssignFormModel',
            },
        { skipSave: !model.context.flowSettingsEnabled },
      )) as AssignFormModel;
      if (cancelled) return;

      if (isValidResourceInit(init)) {
        const existingInit = loaded.getStepParams?.('resourceSettings', 'init');
        // Ensure `resourceSettings.init` is available before first render to avoid cached undefined `collection`
        if (
          !isValidResourceInit(existingInit) ||
          existingInit.dataSourceKey !== init.dataSourceKey ||
          existingInit.collectionName !== init.collectionName
        ) {
          loaded.setStepParams?.('resourceSettings', 'init', init);
        }
        clearResourceContextCache(loaded);
        clearResourceContextCache(loaded.subModels?.grid);
      }

      const prev = action.getStepParams?.(props.settingsFlowKey, ASSIGN_FIELD_VALUES_STEP_KEY) || {};
      loaded.setInitialAssignedValues(prev?.assignedValues || {});

      const isBulkCollectionAction = model instanceof CollectionActionModel && !(model instanceof RecordActionModel);
      const isBulk = props.clearRecordContext || isBulkCollectionAction;
      if (isBulk && loaded.context?.defineProperty) {
        loaded.context.defineProperty('record', { get: () => undefined, cache: false });
      }

      setFormModel(loaded);
      action.assignFormUid = loaded?.uid || action.assignFormUid;
    };
    loadAssignForm();
    return () => {
      cancelled = true;
    };
  }, [
    action,
    blockModel,
    engine,
    model,
    model.context.flowSettingsEnabled,
    props.clearRecordContext,
    props.settingsFlowKey,
  ]);

  return formModel ? <FlowModelRenderer model={formModel} showFlowSettings={false} /> : null;
}

export function createAssignFieldValuesStep(options: AssignFieldValuesStepOptions) {
  return {
    title: options.title || tExpr('Assign field values'),
    uiSchema() {
      return {
        tip: options.tipComponent
          ? {
              'x-decorator': 'FormItem',
              'x-component': options.tipComponent,
            }
          : undefined,
        editor: {
          'x-decorator': 'FormItem',
          'x-component': () => (
            <AssignFieldsEditor
              settingsFlowKey={options.settingsFlowKey}
              clearRecordContext={options.clearRecordContext}
            />
          ),
        },
      };
    },
    async beforeParamsSave(
      ctx: {
        model: AssignFieldValuesModel;
        engine: {
          getModel?: (uid: string, fromRoot?: boolean) => AssignFormModel | undefined;
          findModelByParentId?: (parentId: string, subKey: string) => AssignFormModel | undefined | null;
        };
      },
      params?: { assignedValues?: AssignedValues },
      previousParams?: { assignedValues?: AssignedValues },
    ) {
      const form = resolveAssignFormModel(ctx);
      if (!form) {
        const assignedValues = params?.assignedValues || previousParams?.assignedValues || {};
        ctx.model.setStepParams?.(options.settingsFlowKey, ASSIGN_FIELD_VALUES_STEP_KEY, { assignedValues });
        return;
      }
      if (options.validateBeforeSave) {
        await form.form?.validateFields?.();
      }
      const assignedValues = form.getAssignedValues?.() || {};
      ctx.model.setStepParams?.(options.settingsFlowKey, ASSIGN_FIELD_VALUES_STEP_KEY, { assignedValues });
    },
    handler() {},
  };
}
