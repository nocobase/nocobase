/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngineContext, ModelConstructor } from '@nocobase/flow-engine';
import {
  CollectionField,
  FlowModel,
  createCollectionContextMeta,
  createCurrentRecordMetaFactory,
  createEphemeralContext,
  useFlowSettingsContext,
} from '@nocobase/flow-engine';
import { Skeleton } from 'antd';
import React, { useEffect, useState } from 'react';
import { FilterGroup, VariableFilterItem } from '../../components/filter';
import { FormItemModel } from '../../models/blocks/form/FormItemModel';

const DATA_SCOPE_ACTION_NAME = 'dataScope';

export const QUICK_EDIT_DATA_SCOPE_FLOW_KEY = 'tableColumnSettings';
export const QUICK_EDIT_DATA_SCOPE_STEP_KEY = 'quickEditDataScope';

export type DataScopeStepLocation = { flowKey: string; stepKey: string };

/**
 * Minimal shape read off a model class: the static flow registry and the `use` of each step. `ModelConstructor` does not
 * declare the registry, so the lookup reaches for it through this shape instead of widening to `any`.
 */
type FlowRegistryHolder = {
  globalFlowRegistry?: {
    getFlows?: () => Map<string, { steps?: Record<string, { use?: string } | undefined> } | undefined>;
  };
};

type DataScopeFilter = { logic?: string; items?: unknown[] } | undefined;

/**
 * Locate the flow and step that carry the shared `dataScope` action on a field model class. Both association editors
 * currently keep it under `selectSettings`, but the lookup resolves it from the class instead of hard-coding that name,
 * so an editor registered later is picked up without touching the quick edit path. Returns the first match.
 */
export function findDataScopeStep(
  ModelClass: ModelConstructor | typeof FlowModel | undefined | null,
): DataScopeStepLocation | null {
  const flows = (ModelClass as unknown as FlowRegistryHolder | undefined)?.globalFlowRegistry?.getFlows?.();
  if (!flows) {
    return null;
  }
  for (const [flowKey, flow] of flows) {
    for (const [stepKey, step] of Object.entries(flow?.steps || {})) {
      if (step?.use === DATA_SCOPE_ACTION_NAME) {
        return { flowKey, stepKey };
      }
    }
  }
  return null;
}

/**
 * Resolve the data scope step of the editor model that the quick edit popover builds for `collectionField`. Returns null
 * when the field is not an association or when its default editor has no data scope step, which is what the column
 * setting uses to decide whether to offer the item at all.
 */
export function resolveQuickEditDataScopeStep(
  ctx: FlowEngineContext,
  collectionField: CollectionField,
): DataScopeStepLocation | null {
  if (!collectionField?.isAssociationField?.()) {
    return null;
  }
  // Resolve through the same class the quick edit popover builds its editor with, so the setting is offered exactly
  // when the editor that will actually open has a data scope step.
  const binding = FormItemModel.getDefaultBindingByField(ctx, collectionField);
  if (!binding?.modelName) {
    return null;
  }
  return findDataScopeStep(ctx.engine?.getModelClass?.(binding.modelName));
}

export function isEmptyDataScopeFilter(filter: DataScopeFilter) {
  return !filter || !Array.isArray(filter.items) || filter.items.length === 0;
}

/** Read the quick edit data scope filter stored on the table column that owns `sourceFieldModel`. */
export function getQuickEditDataScopeFilter(sourceFieldModel?: FlowModel): DataScopeFilter {
  const columnModel = sourceFieldModel?.parent as FlowModel | undefined;
  const params = columnModel?.getStepParams?.(QUICK_EDIT_DATA_SCOPE_FLOW_KEY, QUICK_EDIT_DATA_SCOPE_STEP_KEY);
  const filter = params?.filter as DataScopeFilter;
  return isEmptyDataScopeFilter(filter) ? undefined : filter;
}

/**
 * Build a stand-in model for the filter builder. The setting lives on the table column, but the filter describes records
 * of the association target, so the dialog needs a context where `collection` is the target collection. `record` is
 * declared with meta only so that "Current record" stays selectable as a right-hand variable; it has no value at
 * configuration time and is resolved per row when the popover opens.
 */
function useQuickEditDataScopeModel(columnModel: FlowModel): FlowModel | null {
  const [scopedModel, setScopedModel] = useState<FlowModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    const build = async () => {
      const collectionField = columnModel.context.collectionField as CollectionField;
      const getTargetCollection = () => collectionField?.targetCollection ?? null;
      const getSourceCollection = () => columnModel.context.collection ?? null;
      const scopedContext = await createEphemeralContext(columnModel.context, {
        defineProperties: {
          collection: {
            get: getTargetCollection,
            meta: createCollectionContextMeta(getTargetCollection, 'Current collection'),
          },
          record: {
            get: () => undefined,
            meta: createCurrentRecordMetaFactory(columnModel.context, getSourceCollection),
          },
        },
      });
      if (cancelled) {
        return;
      }
      setScopedModel(
        new Proxy(columnModel, {
          get(target, key, receiver) {
            if (key === 'context') {
              return scopedContext;
            }
            const value = Reflect.get(target, key, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
          },
        }),
      );
    };

    build();

    return () => {
      cancelled = true;
    };
  }, [columnModel]);

  return scopedModel;
}

export function QuickEditDataScopeInput(props: { value?: Record<string, any> }) {
  const flowContext = useFlowSettingsContext<FlowModel>();
  const scopedModel = useQuickEditDataScopeModel(flowContext.model);

  if (!scopedModel) {
    return <Skeleton.Input active size="small" />;
  }

  return (
    <FilterGroup
      value={props.value}
      FilterItem={(p) => <VariableFilterItem {...p} model={scopedModel} rightAsVariable />}
    />
  );
}
