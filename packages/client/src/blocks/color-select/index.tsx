import React from 'react'
import { connect, mapProps, mapReadPretty } from '@formily/react'
import { Tag, Select } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const colors = {
  red: '薄暮',
  magenta: '法式洋红',
  volcano: '火山',
  orange: '日暮',
  gold: '金盏花',
  lime: '青柠',
  green: '极光绿',
  cyan: '明青',
  blue: '拂晓蓝',
  geekblue: '极客蓝',
  purple: '酱紫',
  default: '默认',
};

export const ColorSelect = connect(
  (props) => {
    return (
      <Select {...props}>
        {Object.keys(colors).map(color => (
          <Select.Option value={color}>
            <Tag color={color}>{colors[color]}</Tag>
          </Select.Option>
        ))}
      </Select>
    )
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
    }
  }),
  mapReadPretty((props) => {
    const { value } = props;
    if (!colors[value]) {
      return null;
    }
    return (
      <Tag color={value}>{colors[value]}</Tag>
    );
  })
)

export default ColorSelect
