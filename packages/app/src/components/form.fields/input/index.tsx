import { connect } from '@formily/react-schema-renderer'
import React from 'react';
import { Input as AntdInput } from 'antd'
import { acceptEnum, mapStyledProps, mapTextComponent } from '../shared'

export const Input = connect<'TextArea'>({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(acceptEnum(AntdInput))

Input.TextArea = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(acceptEnum((props) => <AntdInput.TextArea autoSize={{minRows: 2, maxRows: 12}} {...props}/>))

export default Input
