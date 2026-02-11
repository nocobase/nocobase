/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 通用的字段子模型重建工具：
 * - 保留原有 uid
 * - 通过 FieldModel 入口 + fieldBinding.use 动态选择目标字段类
 * - 支持同步父项模式（pattern）
 * - 重建后触发 beforeRender（useCache: false）
 */
import { FieldModel } from '@nocobase/client';
import { FlowEngine, FlowModel, StepParams } from '@nocobase/flow-engine';

type FieldBindingParams = {
  fieldBinding?: { use?: string };
  fieldSettings?: { init?: unknown };
};

type FieldStepParams = Record<string, unknown> & FieldBindingParams;

type FieldParentModel = FlowModel & {
  subModels: FlowModel['subModels'] & {
    field?: FieldModel;
  };
  getFieldSettingsInitParams?: () => unknown;
};

type RebuildOptions = {
  parentModel: FieldParentModel;
  targetUse: string;
  defaultProps?: Record<string, unknown>;
  pattern?: string;
  fieldSettingsInit?: unknown;
};

export function getFieldBindingUse(fieldModel?: FieldModel): string | undefined {
  const bindingUse = (fieldModel?.stepParams as FieldStepParams | undefined)?.fieldBinding?.use;
  return typeof bindingUse === 'string' ? bindingUse : undefined;
}

export async function rebuildFieldSubModel({
  parentModel,
  targetUse,
  defaultProps,
  pattern,
  fieldSettingsInit,
}: RebuildOptions) {
  const fieldModel = parentModel.subModels['field'];
  const fieldUid = fieldModel?.uid;
  const prevSubModels = fieldModel?.serialize?.()?.subModels;
  // RecordPickerFieldModel 的子model提前创建会报错
  for (const key in prevSubModels) {
    const subModel = prevSubModels[key];
    if (subModel.delegateToParent === false) {
      delete prevSubModels[key];
    }
  }
  const prevStepParams: FieldStepParams = (fieldModel?.stepParams as FieldStepParams) || {};
  const nextFieldSettingsInit = fieldSettingsInit ?? parentModel.getFieldSettingsInitParams?.();

  const nextStepParams: FieldStepParams = {
    ...prevStepParams,
    fieldBinding: { ...prevStepParams.fieldBinding, use: targetUse },
    fieldSettings: {
      init: nextFieldSettingsInit,
    },
  };

  const engine: FlowEngine = parentModel.flowEngine;

  if (fieldUid) {
    fieldModel?.invalidateFlowCache('beforeRender', true);
    engine.removeModelWithSubModels(fieldUid);
  }

  const subModel = parentModel.setSubModel('field', {
    uid: fieldUid,
    use: FieldModel,
    props: { ...(defaultProps || {}), ...(pattern ? { pattern } : {}) },
    stepParams: nextStepParams as StepParams,
    // Preserve existing subModels (e.g. SubTable columns) so switching field component back and forth
    // does not require a full page refresh to restore the UI.
    subModels: prevSubModels,
  });

  await subModel.dispatchEvent('beforeRender', undefined, { useCache: false });
  await parentModel.save();
}
