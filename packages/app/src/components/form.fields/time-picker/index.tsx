import { connect } from '@formily/react-schema-renderer'
import moment from 'moment'
import { TimePicker as AntdTimePicker } from 'antd'
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr,
} from '../shared'

const transformMoment = (value) => {
  if (value === '') return undefined
  return value
}

const mapMomentValue = (props: any, fieldProps: any) => {
  const { value } = props
  if (!fieldProps.editable) return props
  try {
    if (isStr(value) && value) {
      props.value = moment(value, 'HH:mm:ss')
    } else if (isArr(value) && value.length) {
      props.value = value.map(
        (item) => (item && moment(item, 'HH:mm:ss')) || ''
      )
    }
  } catch (e) {
    throw new Error(e)
  }
  return props
}

export const TimePicker = connect<'RangePicker'>({
  getValueFromEvent(_, value) {
    return transformMoment(value)
  },
  getProps: compose(mapStyledProps, mapMomentValue),
  getComponent: mapTextComponent,
})(AntdTimePicker)

TimePicker.RangePicker = connect({
  getValueFromEvent(_, [startDate, endDate]) {
    return [transformMoment(startDate), transformMoment(endDate)]
  },
  getProps: compose(mapStyledProps, mapMomentValue),
  getComponent: mapTextComponent,
})(AntdTimePicker.RangePicker)

export default TimePicker
