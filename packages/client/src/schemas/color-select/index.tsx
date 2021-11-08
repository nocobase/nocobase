import React from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Tag, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useCompile } from '../../hooks/useCompile';

const colors = {
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

export const ColorSelect = connect(
  (props) => {
    const compile = useCompile();
    return (
      <Select {...props}>
        {Object.keys(colors).map((color) => (
          <Select.Option value={color}>
            <Tag color={color}>{compile(colors[color] || colors.default)}</Tag>
          </Select.Option>
        ))}
      </Select>
    );
  },
  mapProps((props, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    };
  }),
  mapReadPretty((props) => {
    const compile = useCompile();
    const { value } = props;
    if (!colors[value]) {
      return null;
    }
    return <Tag color={value}>{compile(colors[value] || colors.default)}</Tag>;
  }),
);

export default ColorSelect;
