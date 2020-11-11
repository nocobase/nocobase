import {
  connect
} from '@formily/react-schema-renderer'
import { Checkbox as AntdCheckbox } from 'antd'
import {
  transformDataSourceKey,
  mapStyledProps,
  mapTextComponent
} from '../shared'

export const Checkbox = connect<'Group'>({
  valueName: 'checked',
  getProps: mapStyledProps
})(AntdCheckbox)

Checkbox.Group = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(transformDataSourceKey(AntdCheckbox.Group, 'options'))

export default Checkbox
