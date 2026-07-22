/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, CreateModelOptions, FlowEngineContext, FlowModel, StepParams } from '@nocobase/flow-engine';
import { cloneDeep, omit } from 'lodash';
import { DetailsItemModel } from '../../models/blocks/details/DetailsItemModel';
import { FieldModel } from '../../models/base/FieldModel';
import { getFieldBindingUse, rebuildFieldSubModel } from './rebuildFieldSubModel';

export type AssociationFieldPatternMode = 'editable' | 'readPretty';

type SerializedSubModels = NonNullable<CreateModelOptions['subModels']>;

type AssociationFieldComponentState = {
  version: 1;
  useByMode: Partial<Record<AssociationFieldPatternMode, string>>;
  subModelsByUse: Record<string, SerializedSubModels>;
  stepParamsByUse: Record<string, StepParams>;
};

type AssociationFieldParentModel = FlowModel & {
  subModels: FlowModel['subModels'] & {
    field?: FieldModel;
  };
  getFieldSettingsInitParams?: () => unknown;
};

type AssociationFieldContext = FlowEngineContext & {
  collectionField: CollectionField;
};

type RebuildAssociationFieldOptions = {
  ctx: AssociationFieldContext;
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
    version: 1,
    useByMode: {},
    subModelsByUse: {},
    stepParamsByUse: {},
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
  if (state?.version === 1) {
    return {
      ...createEmptyState(),
      ...cloneDeep(state),
      useByMode: cloneDeep(state.useByMode || {}),
      subModelsByUse: cloneDeep(state.subModelsByUse || {}),
      stepParamsByUse: cloneDeep(state.stepParamsByUse || {}),
    };
  }
  return createEmptyState();
}

function setComponentState(model: AssociationFieldParentModel, state: AssociationFieldComponentState) {
  model.setStepParams(FORM_SETTINGS_FLOW, FIELD_COMPONENT_STEP, {
    [COMPONENT_STATE_PARAM]: state,
  });
}

function getSerializableSubModels(fieldModel?: FieldModel): SerializedSubModels {
  const serialized = fieldModel?.serialize?.() as CreateModelOptions | undefined;
  const subModels = cloneDeep(serialized?.subModels || {});
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

function hasSubModelSnapshot(state: AssociationFieldComponentState, use: string) {
  return Object.prototype.hasOwnProperty.call(state.subModelsByUse, use);
}

function getFieldPathFromItem(item: CreateModelOptions): string | undefined {
  const stepParams = item.stepParams as StepParams | undefined;
  const init = stepParams?.fieldSettings?.init as { fieldPath?: unknown } | undefined;
  return typeof init?.fieldPath === 'string' ? init.fieldPath : undefined;
}

function getTargetCollectionField(
  ctx: AssociationFieldContext,
  parentModel: AssociationFieldParentModel,
  fieldPath: string,
) {
  const parentFieldPath = parentModel.getFieldSettingsInitParams?.() as { fieldPath?: string } | undefined;
  const prefix = parentFieldPath?.fieldPath;
  const relativePath = prefix && fieldPath.startsWith(`${prefix}.`) ? fieldPath.slice(prefix.length + 1) : fieldPath;
  const fieldName = relativePath.split('.')[0];
  return ctx.collectionField?.targetCollection?.getField(fieldName);
}

function mapDetailItemStepParams(item: CreateModelOptions): StepParams {
  const source = cloneDeep((item.stepParams || {}) as StepParams);
  const editSettings = source.editItemSettings || {};
  const detailItemSettings: Record<string, unknown> = {};

  if (editSettings.showLabel) {
    detailItemSettings.showLabel = cloneDeep(editSettings.showLabel);
  }
  if (editSettings.label) {
    const editLabel = editSettings.label as { label?: unknown };
    detailItemSettings.label = {
      title: editLabel.label,
    };
  }
  if (editSettings.tooltip) {
    detailItemSettings.tooltip = cloneDeep(editSettings.tooltip);
  }
  if (editSettings.description) {
    detailItemSettings.description = cloneDeep(editSettings.description);
  }

  return {
    ...(source.fieldSettings ? { fieldSettings: cloneDeep(source.fieldSettings) } : {}),
    ...(Object.keys(detailItemSettings).length ? { detailItemSettings } : {}),
  };
}

function mapDetailItemProps(item: CreateModelOptions) {
  return omit(cloneDeep(item.props || {}), [
    'aclCreateDisabled',
    'aclDisabled',
    'disabled',
    'initialValue',
    'name',
    'pattern',
    'rules',
    'value',
  ]);
}

function createDetailsItemOptions(
  ctx: AssociationFieldContext,
  parentModel: AssociationFieldParentModel,
  item: CreateModelOptions,
): CreateModelOptions | undefined {
  const fieldPath = getFieldPathFromItem(item);
  if (!fieldPath) {
    return;
  }
  const collectionField = getTargetCollectionField(ctx, parentModel, fieldPath);
  if (!collectionField) {
    return;
  }
  const binding = DetailsItemModel.getDefaultBindingByField(ctx, collectionField, {
    fallbackToTargetTitleField: true,
  });
  if (!binding) {
    return;
  }
  const sourceField = item.subModels?.field;
  const sourceFieldOptions = !Array.isArray(sourceField) && isCreateModelOptions(sourceField) ? sourceField : undefined;
  const defaultProps =
    typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, collectionField) : binding.defaultProps;

  return {
    uid: item.uid,
    use: 'DetailsItemModel',
    props: mapDetailItemProps(item),
    stepParams: mapDetailItemStepParams(item),
    sortIndex: item.sortIndex,
    subModels: {
      field: {
        uid: sourceFieldOptions?.uid,
        use: binding.modelName,
        props: cloneDeep(defaultProps || {}),
      },
    },
  };
}

export function migrateFormSubModelsToDetails(
  subModels: SerializedSubModels,
  options: {
    ctx: AssociationFieldContext;
    parentModel: AssociationFieldParentModel;
  },
): SerializedSubModels | undefined {
  const { ctx, parentModel } = options;
  const sourceGrid = subModels.grid;
  if (Array.isArray(sourceGrid) || !isCreateModelOptions(sourceGrid)) {
    return;
  }
  const sourceGridUse = normalizeModelUse(sourceGrid.use);
  if (sourceGridUse === 'DetailsGridModel') {
    return cloneDeep(subModels);
  }
  if (sourceGridUse !== 'FormGridModel') {
    return;
  }

  const sourceItems = sourceGrid.subModels?.items;
  const detailItems = Array.isArray(sourceItems)
    ? sourceItems
        .filter(isCreateModelOptions)
        .map((item) => createDetailsItemOptions(ctx, parentModel, item))
        .filter((item): item is CreateModelOptions => !!item)
    : [];
  const detailsGrid: CreateModelOptions = {
    ...cloneDeep(sourceGrid),
    use: 'DetailsGridModel',
    subModels: {
      ...(sourceGrid.subModels || {}),
      items: detailItems,
    },
  };

  return {
    ...cloneDeep(subModels),
    grid: detailsGrid,
  };
}

export function getAssociationFieldModeUse(model: AssociationFieldParentModel, mode: AssociationFieldPatternMode) {
  return getComponentState(model).useByMode[mode];
}

export function shouldUseAssociationFieldComponentState(model: AssociationFieldParentModel, targetUse: string) {
  const currentUse = getCurrentFieldUse(model);
  const state = getComponentState(model);
  return (
    !!state.useByMode.editable ||
    !!state.useByMode.readPretty ||
    STRUCTURED_ASSOCIATION_FIELD_USES.has(targetUse) ||
    (currentUse ? STRUCTURED_ASSOCIATION_FIELD_USES.has(currentUse) : false)
  );
}

export async function rebuildAssociationFieldSubModel({
  ctx,
  parentModel,
  targetUse,
  defaultProps,
  sourceMode,
  targetMode,
  pattern,
}: RebuildAssociationFieldOptions) {
  const state = getComponentState(parentModel);
  const currentUse = getCurrentFieldUse(parentModel);

  if (currentUse) {
    state.useByMode[sourceMode] = currentUse;
    state.subModelsByUse[currentUse] = getSerializableSubModels(parentModel.subModels.field);
    state.stepParamsByUse[currentUse] = cloneDeep(parentModel.subModels.field?.stepParams || {});
  }

  let targetSubModels = hasSubModelSnapshot(state, targetUse) ? cloneDeep(state.subModelsByUse[targetUse]) : undefined;

  if (!targetSubModels && DISPLAY_TO_EDITABLE_USE[targetUse]) {
    const editableUse = state.useByMode.editable || DISPLAY_TO_EDITABLE_USE[targetUse];
    const editableSubModels = state.subModelsByUse[editableUse];
    if (editableSubModels) {
      targetSubModels = migrateFormSubModelsToDetails(editableSubModels, { ctx, parentModel });
      if (targetSubModels) {
        state.subModelsByUse[targetUse] = cloneDeep(targetSubModels);
      }
    }
  }

  state.useByMode[targetMode] = targetUse;
  setComponentState(parentModel, state);

  return rebuildFieldSubModel({
    parentModel,
    targetUse,
    defaultProps,
    pattern,
    preserveSubModels: false,
    subModels: targetSubModels,
    stepParams: state.stepParamsByUse[targetUse],
  });
}

export function normalizeLegacyAssociationDisplaySubModels(options: {
  ctx: AssociationFieldContext;
  parentModel: AssociationFieldParentModel;
  displayUse: string;
  subModels?: SerializedSubModels;
}) {
  const { ctx, parentModel, displayUse, subModels } = options;
  if (!subModels || !DISPLAY_TO_EDITABLE_USE[displayUse]) {
    return subModels;
  }
  const sourceGrid = subModels.grid;
  if (Array.isArray(sourceGrid) || !isCreateModelOptions(sourceGrid)) {
    return subModels;
  }
  if (normalizeModelUse(sourceGrid.use) !== 'FormGridModel') {
    return subModels;
  }

  const state = getComponentState(parentModel);
  const editableUse = DISPLAY_TO_EDITABLE_USE[displayUse];
  state.useByMode.editable = state.useByMode.editable || editableUse;
  state.useByMode.readPretty = displayUse;
  state.subModelsByUse[editableUse] = cloneDeep(subModels);

  const migrated = migrateFormSubModelsToDetails(subModels, { ctx, parentModel });
  if (migrated) {
    state.subModelsByUse[displayUse] = cloneDeep(migrated);
    setComponentState(parentModel, state);
    return migrated;
  }
  return subModels;
}
