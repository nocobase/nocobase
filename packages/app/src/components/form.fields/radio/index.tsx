import { connect } from '@formily/react-schema-renderer'
import { Radio as AntdRadio } from 'antd'
import {
  transformDataSourceKey,
  mapStyledProps,
  mapTextComponent
} from '../shared'

export const Radio = connect<'Group'>({
  valueName: 'checked',
  getProps: mapStyledProps
})(AntdRadio)

Radio.Group = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(transformDataSourceKey(AntdRadio.Group, 'options'))

export default Radio
