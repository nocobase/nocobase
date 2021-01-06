import { connect } from '@formily/react-schema-renderer'
import React from 'react';
import { Select, Tag } from 'antd';
import {
  Select as AntdSelect,
  mapStyledProps,
  mapTextComponent
} from '../shared'

export const ColorSelect = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})((props) => {

  const colors = {
    'red': '薄暮',
    'magenta': '法式洋红',
    'volcano': '火山',
    'orange': '日暮',
    'gold': '金盏花',
    'lime': '青柠',
    'green': '极光绿',
    'cyan': '明青',
    'blue': '拂晓蓝',
    'geekblue': '极客蓝',
    'purple': '酱紫',
  };

  return (
    <Select {...props}>
      {Object.keys(colors).map(color => (
        <Select.Option value={color}>
          <Tag color={color}>{colors[color]}</Tag>
        </Select.Option>
      ))}
    </Select>
  )
})

export default ColorSelect
