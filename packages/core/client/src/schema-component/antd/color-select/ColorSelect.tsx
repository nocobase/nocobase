/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Select, SelectProps, Tag } from 'antd';
import React from 'react';
import { useCompile } from '../../hooks/useCompile';

const defaultColors = {
  red: '{{t("Red")}}',
  magenta: '{{t("Magenta")}}',
  volcano: '{{t("Volcano")}}',
  orange: '{{t("Orange")}}',
  gold: '{{t("Gold")}}',
  lime: '{{t("Lime")}}',
  green: '{{t("Green")}}',
  cyan: '{{t("Cyan")}}',
  blue: '{{t("Blue")}}',
  geekblue: '{{t("Geek blue")}}',
  purple: '{{t("Purple")}}',
  default: '{{t("Default")}}',
};

export interface ColorSelectProps extends SelectProps {
  suffix?: React.ReactNode;
  colors?: Record<string, string>;
}

export const ColorSelect = connect(
  (props: ColorSelectProps) => {
    const compile = useCompile();
    const { colors = defaultColors, ...selectProps } = props;
    return (
      <Select {...selectProps}>
        {Object.keys(colors).map((color) => (
          <Select.Option key={color} value={color}>
            <Tag color={color}>{compile(colors[color] || colors.default)}</Tag>
          </Select.Option>
        ))}
      </Select>
    );
  },
  mapProps((props, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    const compile = useCompile();
    const { value, colors = defaultColors } = props;
    if (!colors[value]) {
      return null;
    }
    return <Tag color={value}>{compile(colors[value] || colors.default)}</Tag>;
  }),
);

export default ColorSelect;
