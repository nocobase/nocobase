import React from 'react'
import { connect, mapReadPretty, mapProps } from '@formily/react'
import { Cascader as AntdCascader } from 'antd'
import { Descriptions } from '../descriptions'
import { LoadingOutlined } from '@ant-design/icons'

export const Cascader = connect(
  (props) => {
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
  mapReadPretty(Descriptions.Cascader)
)

export default Cascader
