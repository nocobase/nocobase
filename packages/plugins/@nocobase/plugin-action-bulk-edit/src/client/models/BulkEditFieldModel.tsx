/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FieldModelRenderer, FieldModel, RecordSelectFieldModel, titleField } from '@nocobase/client';
import { Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import _ from 'lodash';
import { BulkEditFormItemValueType } from './types';
import { lang } from '../locale';
import { ParamObject, StepParams } from '@nocobase/flow-engine';
import { BulkEditFormItemModel } from './BulkEditFormItemModel';

function toFormFieldValue(value: any) {
  if (BulkEditFormItemValueType.Clear in value) {
    return null;
  } else if (BulkEditFormItemValueType.ChangedTo in value) {
    return value[BulkEditFormItemValueType.ChangedTo];
  } else if (BulkEditFormItemValueType.RemainsTheSame in value) {
    return;
  }
}

const BulkEditField = (props) => {
  const { fieldModel, formItemModel, bulkEditFieldModel, onChange, ...rest } = props;
  const [type, setType] = useState<number>(BulkEditFormItemValueType.RemainsTheSame);
  const [value, setValue] = useState(null);
  const form = formItemModel.context.blockModel.form;

  const typeChangeHandler = (val) => {
    setType(val);
    const required = val === BulkEditFormItemValueType.ChangedTo;
    // 设置必填状态
    if (required) {
      const rules = [
        {
          required: true,
          message: formItemModel.context.t('The field value is required'),
        },
      ];
      formItemModel?.setProps({ required: true, rules });
    } else {
      formItemModel?.setProps({ required: false, rules: [] });
    }
    const fieldValue = toFormFieldValue({ [val]: value });
    form.setFieldValue(formItemModel.props.name, fieldValue);
  };

  const valueChangeHandler = (val) => {
    const v = val?.target?.value ?? val?.target?.checked ?? val;
    setValue(v);
    onChange?.(v);
  };

  useEffect(() => {
    // 同步 stepParams 到 inner fieldModel
    fieldModel?.setStepParams(bulkEditFieldModel.getStepParams());
  }, []);

  return (
    <Space
      className={css`
        display: flex;
        > .ant-space-item {
          width: 100%;
        }
      `}
      direction="vertical"
    >
      <Select defaultValue={type} value={type} onChange={typeChangeHandler} disabled={props.aclDisabled}>
        <Select.Option value={BulkEditFormItemValueType.RemainsTheSame}>{lang('Remains the same')}</Select.Option>
        <Select.Option value={BulkEditFormItemValueType.ChangedTo}>{lang('Changed to')}</Select.Option>
        <Select.Option value={BulkEditFormItemValueType.Clear}>{lang('Clear')}</Select.Option>
      </Select>
      {/* {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface !== 'checkbox' && (
          <CollectionField {...props} value={value} onChange={valueChangeHandler} style={{ minWidth: 150 }} />
        )}
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface === 'checkbox' && <Checkbox checked={value} onChange={valueChangeHandler} />} */}
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) && (
        <FieldModelRenderer model={fieldModel} {...rest} onChange={valueChangeHandler} />
      )}
    </Space>
  );
};

export class BulkEditFieldModel extends FieldModel {
  // Override setProps to sync props to inner field model
  setProps(props: Record<string, any>): void;
  setProps(key: string, value: any): void;
  setProps(props: Record<string, any> | string, value?: any): void {
    super.setProps(props as any, value);
    const innerField = this.subModels?.field as FieldModel | undefined;
    innerField?.setProps(props as any, value);
  }
  // Override setStepParams to sync stepParams to inner field model
  setStepParams(flowKey: string, stepKey: string, params: ParamObject): void;
  setStepParams(flowKey: string, stepParams: Record<string, ParamObject>): void;
  setStepParams(allParams: StepParams): void;
  setStepParams(
    flowKeyOrAllParams: string | StepParams,
    stepKeyOrStepsParams?: string | Record<string, ParamObject>,
    params?: ParamObject,
  ): void {
    super.setStepParams(flowKeyOrAllParams as any, stepKeyOrStepsParams as any, params as any);
    const innerField = this.subModels?.field as FieldModel | undefined;
    innerField?.setStepParams(flowKeyOrAllParams as any, stepKeyOrStepsParams as any, params as any);
  }

  async openFlowSettings(options?: any) {
    const flowKey = options?.flowKey;
    const innerField = this.subModels?.field as any;
    if (flowKey && !this.getFlow(flowKey) && innerField?.openFlowSettings) {
      return innerField.openFlowSettings(options);
    }
    return super.openFlowSettings(options);
  }

  public render() {
    const fieldModel = this.subModels.field as FieldModel;

    return (
      <BulkEditField formItemModel={this.parent} bulkEditFieldModel={this} fieldModel={fieldModel} {...this.props} />
    );
  }
}

const isBulkEditContext = (ctx: any) => {
  const parent = ctx?.model?.parent as any;
  if (!parent) {
    return false;
  }
  if (parent instanceof BulkEditFieldModel) {
    return true;
  }
  const grandParent = parent?.parent as any;
  return grandParent instanceof BulkEditFormItemModel;
};

const isBulkEditScene = (ctx: any) => {
  const blockModel = ctx?.blockModel || ctx?.model?.context?.blockModel || ctx?.model?.parent?.context?.blockModel;
  return !!blockModel?.constructor?._isScene?.('bulkEditForm');
};

const getBulkEditFieldNames = (ctx: any) => {
  const own = ctx?.model?.props?.fieldNames;
  if (own?.label && own?.value) {
    return own;
  }
  const parent = ctx?.model?.parent as any;
  const parentFieldNames = parent?.props?.fieldNames;
  if (parentFieldNames?.label && parentFieldNames?.value) {
    return parentFieldNames;
  }
  return null;
};

RecordSelectFieldModel.registerAction({
  ...titleField,
  name: 'titleField',
  // 避免 packages/core/flow-engine/src/models/flowModel.tsx applyFlowSettings 时覆盖 Bulk Edit 场景下的配置
  defaultParams: (ctx: any) => {
    if (isBulkEditContext(ctx)) {
      const existing = getBulkEditFieldNames(ctx);
      if (existing?.label) {
        return { label: existing.label };
      }
    }
    const original = (titleField as any).defaultParams;
    return typeof original === 'function' ? original(ctx) : original;
  },
  // Hide RecordSelectFieldModel's built-in titleField step when in bulk edit context
  async hideInSettings(ctx: any) {
    if (isBulkEditContext(ctx)) {
      return true;
    }
    const original = (titleField as any).hideInSettings;
    return typeof original === 'function' ? await original(ctx) : !!original;
  },
});

const selectSettingsFlow = RecordSelectFieldModel.globalFlowRegistry?.getFlow?.('selectSettings');
const quickCreateStep = selectSettingsFlow?.getStep?.('quickCreate');
if (quickCreateStep) {
  const existing = quickCreateStep.serialize();
  const originalHide = existing.hideInSettings;
  if (!(originalHide as any)?.__bulkEditWrapped) {
    const wrappedHide = (ctx: any) => {
      if (isBulkEditContext(ctx) || isBulkEditScene(ctx)) {
        return true;
      }
      return typeof originalHide === 'function' ? originalHide(ctx) : !!originalHide;
    };
    (wrappedHide as any).__bulkEditWrapped = true;
    quickCreateStep.setOptions({ hideInSettings: wrappedHide });
  }
}
