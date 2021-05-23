import { connect, mapReadPretty } from '@formily/react'
import { InputNumber as AntdNumber } from 'antd'
import { Descriptions } from '../descriptions'

export const InputNumber = connect(
  AntdNumber,
  mapReadPretty(Descriptions.InputNumber)
)

export default InputNumber
