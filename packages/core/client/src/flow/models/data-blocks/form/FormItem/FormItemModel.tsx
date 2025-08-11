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
    const { showLabel, label, labelWrap, colon, labelWidth, layout, ...restProps } = this.getProps();
    const effectiveLabelWrap = layout === 'vertical' ? true : labelWrap;

    const renderLabel = () => {
      if (!showLabel) return null;
      if (effectiveLabelWrap) {
        // 垂直布局或者 labelWrap = true，宽度100%，自动换行
        return (
          <div
            style={{
              width: '100%',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <span style={{ flex: 1 }}>{label}</span>
            {colon && <span style={{ marginLeft: 4, flexShrink: 0 }}>:</span>}
          </div>
        );
      }
      // labelWrap = false → 省略 + tooltip
      return (
        <Tooltip title={label}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              maxWidth: (typeof labelWidth === 'number' ? labelWidth : 120) - 20,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              verticalAlign: 'middle',
            }}
          >
            <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            {colon && <span style={{ marginLeft: 4, flexShrink: 0 }}>:</span>}
          </div>
        </Tooltip>
      );
    };

    return (
      <Form.Item
        {...restProps}
        labelCol={{ style: { width: labelWidth || 120 } }}
        layout={layout}
        label={renderLabel()}
        colon={false}
      >
        <FieldModelRenderer model={fieldModel} />
      </Form.Item>
    );
  }
}
