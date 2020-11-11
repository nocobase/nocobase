import { connect } from '@formily/react-schema-renderer'
import { InputNumber } from 'antd'
import { acceptEnum, mapStyledProps, mapTextComponent } from '../shared'

export const NumberPicker = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(acceptEnum(InputNumber))

export default NumberPicker
