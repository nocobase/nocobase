import { connect } from '@formily/react-schema-renderer'
import { Input as AntdInput } from 'antd'
import { acceptEnum, mapStyledProps, mapTextComponent } from '../shared'

export const Input = connect<'TextArea'>({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(acceptEnum(AntdInput))

Input.TextArea = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(acceptEnum(AntdInput.TextArea))

export default Input
