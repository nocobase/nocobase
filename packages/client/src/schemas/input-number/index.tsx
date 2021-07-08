import { connect, mapReadPretty } from '@formily/react'
import { InputNumber as AntdNumber } from 'antd'
import { Display } from '../display'

export const InputNumber = connect(
  AntdNumber,
  mapReadPretty(Display.InputNumber)
)

export default InputNumber
