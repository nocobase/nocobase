/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FormItemModel,
  FieldModelRenderer,
  FormItem,
  FieldModel,
  RecordSelectFieldModel,
  titleField,
} from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import { Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import _ from 'lodash';
import { useField } from '@formily/react';
import { BulkEditFormItemValueType } from './types';
import { lang } from '../locale';

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
  const { fieldModel, formItemModel, onChange, ...rest } = props;
  const field = useField();
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
    const fieldVlaue = toFormFieldValue({ [val]: value });
    // onChange?.(fieldVlaue);
    form.setFieldValue(formItemModel.props.name, fieldVlaue);
    // form.clearErrors(formItemModel.props.name);
  };

  const valueChangeHandler = (val) => {
    const v = val?.target?.value ?? val?.target?.checked ?? val;
    setValue(v);
    onChange?.(v);
  };

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
    const t = (s) => s;
    return <BulkEditField formItemModel={this.parent} fieldModel={fieldModel} {...this.props} />;
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
  return grandParent?.constructor?.name === 'BulkEditFormItemModel';
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
  // async beforeParamsSave(ctx: any, params: any, previousParams: any) {
  //   if (isBulkEditContext(ctx)) {
  //     return;
  //   }
  //   const original = (titleField as any).beforeParamsSave;
  //   if (typeof original === 'function') {
  //     return original(ctx, params, previousParams);
  //   }
  // },
  // async handler(ctx: any, params: any) {
  //   if (isBulkEditContext(ctx)) {
  //     const existing = getBulkEditFieldNames(ctx);
  //     if (existing?.label && existing?.value) {
  //       ctx.model.setProps({ fieldNames: existing });
  //       return;
  //     }
  //   }
  //   const original = (titleField as any).handler;
  //   if (typeof original === 'function') {
  //     return original(ctx, params);
  //   }
  // },
});
