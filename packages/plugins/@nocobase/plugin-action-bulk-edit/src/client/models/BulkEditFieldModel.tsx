/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItemModel, FieldModelRenderer, FormItem, FieldModel } from '@nocobase/client';
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

  console.log('BulkEditField render called', { fieldModel, formItemModel, field, type, value, props, form });

  const typeChangeHandler = (val) => {
    setType(val);
    const required = val === BulkEditFormItemValueType.ChangedTo;
    formItemModel?.setStepParams('editItemSettings', 'required', { required });
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
      <Select defaultValue={type} value={type} onChange={typeChangeHandler}>
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
  public render() {
    const fieldModel = this.subModels.field as FieldModel;
    console.log('BulkEditFieldModel render called', { fieldModel, parentModel: this.parent, props: this.props });
    const t = (s) => s;

    return <BulkEditField formItemModel={this.parent} fieldModel={fieldModel} {...this.props} />;
  }
}
