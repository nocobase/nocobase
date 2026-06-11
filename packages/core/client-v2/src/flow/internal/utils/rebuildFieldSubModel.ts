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
 * - 直接重建为目标字段类，保持与 defineChildren 初始创建逻辑一致
 * - 支持同步父项模式（pattern）
 * - 同一字段模型类型下保留已有字段设置；切换到其他字段模型类型时丢弃不兼容设置
 * - 重建后触发 beforeRender（useCache: false）
 */
import { FieldModel } from '../../models/base/FieldModel';
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

function normalizeModelUse(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'function' && value.name) {
    return value.name;
  }
  return undefined;
}

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
  const currentUse = normalizeModelUse(getFieldBindingUse(fieldModel) || fieldModel?.use);
  const shouldPreserveStepParams = currentUse === targetUse;
  const prevStepParams: FieldStepParams = shouldPreserveStepParams
    ? (fieldModel?.stepParams as FieldStepParams) || {}
    : {};
  const nextFieldSettingsInit = fieldSettingsInit ?? parentModel.getFieldSettingsInitParams?.();
  const { fieldBinding: _fieldBinding, ...restStepParams } = prevStepParams;

  const nextStepParams: FieldStepParams = {
    ...restStepParams,
    fieldSettings: {
      ...(restStepParams.fieldSettings || {}),
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
    use: targetUse,
    props: { ...(defaultProps || {}), ...(pattern ? { pattern } : {}) },
    stepParams: nextStepParams as StepParams,
    // Preserve existing subModels (e.g. SubTable columns) so switching field component back and forth
    // does not require a full page refresh to restore the UI.
    subModels: prevSubModels,
  });

  await subModel.dispatchEvent('beforeRender', undefined, { useCache: false });
  await parentModel.save();
}
