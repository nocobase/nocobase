import { Switch as AntdSwitch } from 'antd'
import { connect } from '@formily/react-schema-renderer'
import { acceptEnum, mapStyledProps } from '../shared'

export const Switch = connect({
  valueName: 'checked',
  getProps: mapStyledProps
})(acceptEnum(AntdSwitch))

export default Switch;
