import React from 'react'
import { connect, mapProps, mapReadPretty } from '@formily/react'
import { Input as AntdInput } from 'antd'
import { InputProps, TextAreaProps } from 'antd/lib/input'
import { LoadingOutlined } from '@ant-design/icons'
import { Display } from '../display';
import { DesignableBar } from './DesignableBar';

type ComposedInput = React.FC<InputProps> & {
  TextArea?: React.FC<TextAreaProps>
  URL?: React.FC<InputProps>
  DesignableBar?: React.FC<any>
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
  mapReadPretty(Display.Input)
)

Input.DesignableBar = DesignableBar;
Input.TextArea = connect(AntdInput.TextArea, mapReadPretty(Display.TextArea))
Input.URL = connect(AntdInput, mapReadPretty(Display.URL))

export default Input
