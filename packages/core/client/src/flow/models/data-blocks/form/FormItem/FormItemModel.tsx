/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tooltip, Form } from 'antd';
import { FieldModel } from '../../../base/FieldModel';
import { FormFieldGridModel } from '../FormFieldGridModel';
import { FieldModelRenderer } from '../../../fields';

export const FormItem = (props) => {
  return <Form.Item {...props}>{props.children}</Form.Item>;
};

export class FormItemModel extends FieldModel<{
  parent: FormFieldGridModel;
  subModels: { field: FieldModel };
}> {
  setProps(props) {
    Object.assign(this.props, props);
  }

  onInit(options: any): void {
    super.onInit(options);
  }

  render() {
    const fieldModel = this.subModels.field as FieldModel;
    const { showLabel, label, labelWrap, colon, labelWidth, ...restProps } = this.getProps();
    const renderLabel = () => {
      if (!showLabel) return null;
      if (labelWrap) {
        return label;
      }
      // labelWrap = false → 省略 + tooltip
      return (
        <Tooltip title={label}>
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              maxWidth: (labelWidth || 120) - 20,
              verticalAlign: 'middle',
            }}
          >
            {label}
          </span>
          {colon && <span style={{ marginLeft: 4 }}>:</span>}
        </Tooltip>
      );
    };

    return (
      <Form.Item {...restProps} labelCol={{ style: { width: labelWidth || 120 } }} label={renderLabel()} colon={false}>
        <FieldModelRenderer model={fieldModel} />
      </Form.Item>
    );
  }
}
