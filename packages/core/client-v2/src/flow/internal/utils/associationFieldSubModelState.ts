/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateModelOptions, FlowModel, StepParams } from '@nocobase/flow-engine';
import { cloneDeep } from 'lodash';
import { FieldModel } from '../../models/base/FieldModel';
import { getFieldBindingUse, rebuildFieldSubModel } from './rebuildFieldSubModel';

export type AssociationFieldPatternMode = 'editable' | 'readPretty';

type SerializedSubModels = NonNullable<CreateModelOptions['subModels']>;

type AssociationFieldComponentSnapshot = {
  use: string;
  subModels?: SerializedSubModels;
  stepParams?: StepParams;
};

type AssociationFieldComponentState = {
  version: 2;
  byMode: Partial<Record<AssociationFieldPatternMode, AssociationFieldComponentSnapshot>>;
};

type AssociationFieldParentModel = FlowModel & {
  subModels: FlowModel['subModels'] & {
    field?: FieldModel;
  };
  getFieldSettingsInitParams?: () => unknown;
};

type RebuildAssociationFieldOptions = {
  parentModel: AssociationFieldParentModel;
  targetUse: string;
  defaultProps?: Record<string, unknown>;
  sourceMode: AssociationFieldPatternMode;
  targetMode: AssociationFieldPatternMode;
  pattern?: string;
};

const COMPONENT_STATE_PARAM = 'associationFieldComponentState';
const FORM_SETTINGS_FLOW = 'editItemSettings';
const FIELD_COMPONENT_STEP = 'model';

const STRUCTURED_ASSOCIATION_FIELD_USES = new Set([
  'SubFormFieldModel',
  'SubFormListFieldModel',
  'DisplaySubItemFieldModel',
  'DisplaySubListFieldModel',
]);

const DISPLAY_TO_EDITABLE_USE: Record<string, string> = {
  DisplaySubItemFieldModel: 'SubFormFieldModel',
  DisplaySubListFieldModel: 'SubFormListFieldModel',
};

function createEmptyState(): AssociationFieldComponentState {
  return {
    version: 2,
    byMode: {},
  };
}

function normalizeModelUse(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'function' && value.name) {
    return value.name;
  }
  return undefined;
}

function isCreateModelOptions(value: unknown): value is CreateModelOptions {
  return !!value && typeof value === 'object' && 'use' in value;
}

function getCurrentFieldUse(model: AssociationFieldParentModel): string | undefined {
  const fieldModel = model.subModels.field;
  return normalizeModelUse(getFieldBindingUse(fieldModel) || fieldModel?.use);
}

function getComponentState(model: AssociationFieldParentModel): AssociationFieldComponentState {
  const params = model.getStepParams(FORM_SETTINGS_FLOW, FIELD_COMPONENT_STEP) as
    | { [COMPONENT_STATE_PARAM]?: AssociationFieldComponentState }
    | undefined;
  const state = params?.[COMPONENT_STATE_PARAM];
  if (state?.version !== 2) {
    return createEmptyState();
  }
  return {
    version: 2,
    byMode: cloneDeep(state.byMode || {}),
  };
}

function setComponentState(model: AssociationFieldParentModel, state: AssociationFieldComponentState) {
  model.setStepParams(FORM_SETTINGS_FLOW, FIELD_COMPONENT_STEP, {
    [COMPONENT_STATE_PARAM]: state,
  });
}

function getSerializableSubModels(fieldModel?: FieldModel): SerializedSubModels | undefined {
  const serialized = fieldModel?.serialize?.() as CreateModelOptions | undefined;
  if (!serialized?.subModels) {
    return;
  }
  const subModels = cloneDeep(serialized.subModels);
  Object.keys(subModels).forEach((key) => {
    const subModel = subModels[key];
    if (Array.isArray(subModel)) {
      subModels[key] = subModel.filter((item) => !isCreateModelOptions(item) || item.delegateToParent !== false);
    } else if (isCreateModelOptions(subModel) && subModel.delegateToParent === false) {
      delete subModels[key];
    }
  });
  return subModels;
}

function createSnapshot(fieldModel: FieldModel, use: string): AssociationFieldComponentSnapshot {
  const subModels = getSerializableSubModels(fieldModel);
  return {
    use,
    ...(subModels ? { subModels } : {}),
    stepParams: cloneDeep(fieldModel.stepParams || {}),
  };
}

export function getAssociationFieldModeUse(model: AssociationFieldParentModel, mode: AssociationFieldPatternMode) {
  return getComponentState(model).byMode[mode]?.use;
}

export function shouldUseAssociationFieldComponentState(model: AssociationFieldParentModel, targetUse: string) {
  const currentUse = getCurrentFieldUse(model);
  const state = getComponentState(model);
  return (
    !!state.byMode.editable ||
    !!state.byMode.readPretty ||
    STRUCTURED_ASSOCIATION_FIELD_USES.has(targetUse) ||
    (currentUse ? STRUCTURED_ASSOCIATION_FIELD_USES.has(currentUse) : false)
  );
}

export async function rebuildAssociationFieldSubModel({
  parentModel,
  targetUse,
  defaultProps,
  sourceMode,
  targetMode,
  pattern,
}: RebuildAssociationFieldOptions) {
  const state = getComponentState(parentModel);
  const currentUse = getCurrentFieldUse(parentModel);
  const isModeChange = sourceMode !== targetMode;

  if (isModeChange && currentUse && parentModel.subModels.field) {
    state.byMode[sourceMode] = createSnapshot(parentModel.subModels.field, currentUse);
  }

  const savedTarget = isModeChange ? state.byMode[targetMode] : undefined;
  const targetSnapshot = savedTarget?.use === targetUse ? savedTarget : undefined;
  // The active model already owns the restored tree. Keep only its use in state to avoid storing a duplicate snapshot.
  state.byMode[targetMode] = { use: targetUse };
  setComponentState(parentModel, state);

  return rebuildFieldSubModel({
    parentModel,
    targetUse,
    defaultProps,
    pattern,
    preserveSubModels: false,
    subModels: targetSnapshot?.subModels,
    stepParams: targetSnapshot?.stepParams,
  });
}

export function normalizeLegacyAssociationDisplaySubModels(options: {
  parentModel: AssociationFieldParentModel;
  displayUse: string;
  subModels?: CreateModelOptions['subModels'];
}): CreateModelOptions['subModels'] {
  const { parentModel, displayUse, subModels } = options;
  const editableUse = DISPLAY_TO_EDITABLE_USE[displayUse];
  if (!editableUse) {
    return subModels;
  }
  const sourceGrid = subModels?.grid;
  if (Array.isArray(sourceGrid) || !isCreateModelOptions(sourceGrid)) {
    return subModels;
  }
  if (normalizeModelUse(sourceGrid.use) !== 'FormGridModel') {
    return subModels;
  }

  const state = getComponentState(parentModel);
  if (!state.byMode.editable) {
    state.byMode.editable = {
      use: editableUse,
      subModels: {
        grid: cloneDeep(sourceGrid),
      },
    };
  }
  state.byMode.readPretty = { use: displayUse };
  setComponentState(parentModel, state);

  const { grid: _grid, ...compatibleSubModels } = cloneDeep(subModels);
  return compatibleSubModels;
}
