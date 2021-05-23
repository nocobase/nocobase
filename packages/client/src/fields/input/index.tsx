import React from 'react'
import { connect, mapProps, mapReadPretty } from '@formily/react'
import { Input as AntdInput } from 'antd'
import { InputProps, TextAreaProps } from 'antd/lib/input'
import { Descriptions } from '../descriptions'
import { LoadingOutlined } from '@ant-design/icons'

type ComposedInput = React.FC<InputProps> & {
  TextArea?: React.FC<TextAreaProps>
  URL?: React.FC<InputProps>
}

export const Input: ComposedInput = connect(
  AntdInput,
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
  mapReadPretty(Descriptions.Input)
)

Input.TextArea = connect(AntdInput.TextArea, mapReadPretty(Descriptions.TextArea))
Input.URL = connect(AntdInput, mapReadPretty(Descriptions.URL))

export default Input
