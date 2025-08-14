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
import type { FormItemProps } from 'antd';
import { FieldModel } from '../../../base/FieldModel';
import { FormFieldGridModel } from '../FormFieldGridModel';
import { FieldModelRenderer } from '../../../fields';

type ChildExtraProps = Record<string, any>;

// 保持 TS 类型和运行时数据同步
const formItemPropKeys: (keyof FormItemProps)[] = [
  'colon',
  'dependencies',
  'extra',
  'getValueFromEvent',
  'getValueProps',
  'hasFeedback',
  'help',
  'htmlFor',
  'initialValue',
  'label',
  'labelAlign',
  'labelCol',
  'messageVariables',
  'name',
  'normalize',
  'noStyle',
  'preserve',
  'rules',
  'tooltip',
  'trigger',
  'validateStatus',
  'validateTrigger',
  'valuePropName',
  'wrapperCol',
];

export const FormItem = ({ children, ...rest }: FormItemProps & ChildExtraProps) => {
  // 过滤掉 Form.Item 专用 props，只保留要传给子组件的
  const childProps = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !formItemPropKeys.includes(key as keyof FormItemProps)),
  );
  const processedChildren =
    typeof children === 'function'
      ? children
      : React.Children.map(children as React.ReactNode, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { ...childProps });
          }
          return child;
        });
  const { showLabel, label, labelWrap, colon = true, labelWidth, layout, ...restProps } = rest;
  const effectiveLabelWrap = !layout || layout === 'vertical' ? true : labelWrap;
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
      {...rest}
      labelCol={{ style: { width: labelWidth } }}
      layout={layout}
      label={renderLabel()}
      colon={false}
    >
      {processedChildren}
    </Form.Item>
  );
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

    return (
      <FormItem {...this.props}>
        <FieldModelRenderer model={fieldModel} />
      </FormItem>
    );
  }
}
