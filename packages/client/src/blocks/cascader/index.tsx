import React from 'react'
import { connect, mapReadPretty, mapProps } from '@formily/react'
import { Cascader as AntdCascader } from 'antd'
import { Display } from '../display'
import { LoadingOutlined } from '@ant-design/icons'

export const Cascader = connect(
  (props) => {
    console.log('props.title', props.title);
    return <AntdCascader {...props}/>
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      return {
        ...props,
        suffixIcon:
          field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffixIcon
          ),
      }
    }
  ),
  mapReadPretty(Display.Cascader)
)

export default Cascader
