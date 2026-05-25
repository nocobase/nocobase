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
  resolveRunJSObjectValues,
  tExpr,
  type FlowModelContext,
  useFlowEngine,
  useFlowSettingsContext,
} from '@nocobase/flow-engine';
import React, { useEffect, useRef } from 'react';
import { CollectionActionModel } from '../../base/CollectionActionModel';
import { RecordActionModel } from '../../base/RecordActionModel';
import { AssignFormModel } from './AssignFormModel';

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
  },
  rawAssignedValues: unknown,
  logName = 'AssignFieldValues',
): Promise<AssignedValues | null> {
  try {
    return await resolveRunJSObjectValues(ctx, rawAssignedValues);
  } catch (error) {
    console.error(`[${logName}] RunJS execution failed`, error);
    ctx.message?.error?.(ctx.t?.('RunJS execution failed') || 'RunJS execution failed');
    return null;
  }
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
  const initializedRef = useRef(false);
  const [formModel, setFormModel] = React.useState<AssignFormModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadAssignForm = async () => {
      const loaded = (await engine.loadOrCreateModel(
        {
          parentId: action.uid,
          subKey: 'assignForm',
          use: 'AssignFormModel',
        },
        { skipSave: !model.context.flowSettingsEnabled },
      )) as AssignFormModel;
      if (cancelled) return;
      setFormModel(loaded);
      action.assignFormUid = loaded?.uid || action.assignFormUid;
    };
    loadAssignForm();
    return () => {
      cancelled = true;
    };
  }, [action, engine, model.context.flowSettingsEnabled]);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!formModel) return;

    const prev = action.getStepParams?.(props.settingsFlowKey, ASSIGN_FIELD_VALUES_STEP_KEY) || {};
    const coll = blockModel?.collection || getContextCollection(action?.context);
    const dsKey = coll?.dataSourceKey;
    const collName = coll?.name;
    if (dsKey && collName) {
      formModel.setStepParams('resourceSettings', 'init', {
        dataSourceKey: dsKey,
        collectionName: collName,
      });
    }
    formModel.setInitialAssignedValues(prev?.assignedValues || {});

    const isBulk =
      props.clearRecordContext || (action instanceof CollectionActionModel && !(action instanceof RecordActionModel));
    if (isBulk && formModel.context?.defineProperty) {
      formModel.context.defineProperty('record', { get: () => undefined, cache: false });
    }
    initializedRef.current = true;
  }, [action, blockModel?.collection, formModel, props.clearRecordContext, props.settingsFlowKey]);

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
    async beforeParamsSave(ctx: {
      model: AssignFieldValuesModel;
      engine: {
        getModel?: (uid: string, fromRoot?: boolean) => AssignFormModel | undefined;
      };
    }) {
      const form = ctx.model.assignFormUid ? ctx.engine.getModel?.(ctx.model.assignFormUid, true) : undefined;
      if (!form) return;
      if (options.validateBeforeSave) {
        await form.form?.validateFields?.();
      }
      const assignedValues = form.getAssignedValues?.() || {};
      ctx.model.setStepParams?.(options.settingsFlowKey, ASSIGN_FIELD_VALUES_STEP_KEY, { assignedValues });
    },
    handler() {},
  };
}
