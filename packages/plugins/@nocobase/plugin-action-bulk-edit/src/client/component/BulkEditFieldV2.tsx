/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select, Space } from 'antd';
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { BulkEditFormItemValueType } from '../models/types';
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

export const BulkEditFieldV2 = (props) => {
  const { formItemModel, onChange, field, ...rest } = props;
  const [type, setType] = useState<number>(BulkEditFormItemValueType.RemainsTheSame);
  const [value, setValue] = useState(null);
  const form = formItemModel.context.blockModel.form;
  // 保存原始的校验规则
  const [originalRules] = useState(() => formItemModel?.props?.rules || []);

  const typeChangeHandler = (val) => {
    setType(val);
    const fieldValue = toFormFieldValue({ [val]: value });
    form.setFieldValue(formItemModel.props.name, fieldValue);
    if (val === BulkEditFormItemValueType.ChangedTo) {
      const fieldUse = formItemModel?.subModels?.field?.use;
      if (fieldUse === 'CheckboxFieldModel') {
        // checkbox 默认值为 false
        setTimeout(() => {
          valueChangeHandler(false);
        });
      }
    }
  };

  useEffect(() => {
    const required = type === BulkEditFormItemValueType.ChangedTo;
    // 设置必填状态
    if (required) {
      // 移除原始规则中的必填规则
      const otherRules = originalRules.filter((rule) => !rule.required);
      // 添加新的必填规则，保留其他原始规则
      const rules = [
        {
          required: true,
          message: formItemModel.context.t('The field value is required'),
        },
        ...otherRules,
      ];
      formItemModel?.setProps({ required: true, rules });
    } else {
      // 移除所有规则
      formItemModel?.setProps({ required: false, rules: [] });
    }
  }, [type]);

  const valueChangeHandler = (val) => {
    const v = val?.target?.value ?? val?.target?.checked ?? val;
    setValue(v);
    onChange?.(v);
  };

  const child = React.cloneElement(field, {
    ...rest,
    onChange: valueChangeHandler,
  });

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
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) && child}
    </Space>
  );
};
