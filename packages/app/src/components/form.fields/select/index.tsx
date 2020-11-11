import { connect } from '@formily/react-schema-renderer'
import {
  Select as AntdSelect,
  mapStyledProps,
  mapTextComponent
} from '../shared'

export const Select = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(AntdSelect)

export default Select
