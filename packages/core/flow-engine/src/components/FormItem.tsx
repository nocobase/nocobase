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
import type { FormItemProps, TooltipProps } from 'antd';

type ChildExtraProps = Record<string, unknown>;

interface ExtendedFormItemProps extends FormItemProps {
  asterisk?: boolean;
  labelWidth?: number | string;
  labelWrap?: boolean;
  showLabel?: boolean;
}

export const verticalFormItemLabelStyle = { paddingBottom: 0 };
export const formItemStyle = { marginBottom: 12 };

const formItemPropKeys = [
  'colon',
  'className',
  'dependencies',
  'extra',
  'fieldKey',
  'getValueFromEvent',
  'getValueProps',
  'hasFeedback',
  'help',
  'hidden',
  'htmlFor',
  'id',
  'initialValue',
  'isListField',
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
  'labelWidth',
  'labelWrap',
  'layout',
  'required',
  'showLabel',
  'shouldUpdate',
  'style',
  'prefixCls',
  'rootClassName',
  'validateDebounce',
  'validateFirst',
];

const formItemPropKeySet = new Set<string>(formItemPropKeys);
const localOnlyPropKeySet = new Set<string>(['asterisk']);

function splitFormItemProps(props: ExtendedFormItemProps & ChildExtraProps) {
  const formItemProps: Record<string, unknown> = {};
  const childProps: Record<string, unknown> = {};

  Object.entries(props).forEach(([key, value]) => {
    if (localOnlyPropKeySet.has(key)) {
      return;
    }
    if (formItemPropKeySet.has(key)) {
      formItemProps[key] = value;
      return;
    }
    childProps[key] = value;
  });

  return {
    formItemProps: formItemProps as ExtendedFormItemProps,
    childProps,
  };
}

export const FormItem = ({
  children,
  showLabel = true,
  labelWidth,
  ...rest
}: ExtendedFormItemProps & ChildExtraProps) => {
  // Form.Item 会把未知 props 透传到 antd Row 的 DOM 节点。
  // 先拆分出 Form.Item 自身 props，避免模型内部配置（如 titleField）泄漏到 DOM。
  const { formItemProps, childProps } = splitFormItemProps(rest);

  const processedChildren =
    typeof children === 'function'
      ? children
      : React.Children.map(children as React.ReactNode, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, childProps);
          }
          return child;
        });
  const { label, labelWrap, colon = true, layout } = formItemProps;
  const effectiveLabelWrap = !layout || layout === 'vertical' ? true : labelWrap;
  const labelColStyle =
    layout === 'vertical' ? { width: labelWidth, ...verticalFormItemLabelStyle } : { width: labelWidth };
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
            fontWeight: 600,
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
            fontWeight: 600,
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
      {...formItemProps}
      style={{ ...formItemStyle, ...formItemProps.style }}
      labelCol={{ style: labelColStyle }}
      layout={layout}
      label={renderLabel()}
      colon={false}
      extra={formItemProps.extra && <span style={{ whiteSpace: 'pre-wrap' }}>{formItemProps.extra}</span>}
      tooltip={
        formItemProps.tooltip &&
        ({
          title: formItemProps.tooltip,
          overlayInnerStyle: { whiteSpace: 'pre-line' },
        } as TooltipProps)
      }
    >
      {processedChildren}
    </Form.Item>
  );
};
