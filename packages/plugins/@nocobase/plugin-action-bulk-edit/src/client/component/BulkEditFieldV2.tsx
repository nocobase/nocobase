/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import _ from 'lodash';
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
      // checkbox 默认值为 false
      if (formItemModel?.subModels?.field?.use === 'CheckboxFieldModel') {
        setTimeout(() => {
          valueChangeHandler(false);
        });
      }
    } else {
      formItemModel?.setProps({ required: false, rules: [] });
    }
    const fieldVlaue = toFormFieldValue({ [val]: value });
    form.setFieldValue(formItemModel.props.name, fieldVlaue);
  };

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
      {/* {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface !== 'checkbox' && (
          <CollectionField {...props} value={value} onChange={valueChangeHandler} style={{ minWidth: 150 }} />
        )}
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface === 'checkbox' && <Checkbox checked={value} onChange={valueChangeHandler} />} */}
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) && child}
    </Space>
  );
};
