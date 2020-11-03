import { connect } from '@formily/react-schema-renderer'
import { Transfer as AntdTransfer } from 'antd'
import { mapStyledProps } from '../shared'

export const Transfer = connect({
  getProps: mapStyledProps,
  valueName: 'targetKeys'
})(AntdTransfer)

export default Transfer