import React from 'react'
import { connect } from '@formily/react-schema-renderer'
import moment from 'moment'
import { DatePicker as AntdDatePicker } from 'antd'
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr
} from '../shared'

class YearPicker extends React.Component {
  public render() {
    return <AntdDatePicker {...this.props} picker={'year'} />
  }
}

const transformMoment = (value, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (value === '') return undefined
  return value && value.format ? value.format(format) : value
}

const mapMomentValue = (props: any, fieldProps: any) => {
  const { value, showTime = false } = props
  if (!fieldProps.editable) return props
  try {
    if (isStr(value) && value) {
      props.value = moment(
        value,
        showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
      )
    } else if (isArr(value) && value.length) {
      props.value = value.map(
        item =>
          (item &&
            moment(item, showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')) ||
          ''
      )
    }
  } catch (e) {
    throw new Error(e)
  }
  return props
}

export const DatePicker = connect<
  'RangePicker' | 'MonthPicker' | 'YearPicker' | 'WeekPicker'
>({
  getValueFromEvent(_, value) {
    const props = this.props || {}
    return transformMoment(
      value,
      props.format || (props.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
    )
  },
  getProps: compose(mapStyledProps, mapMomentValue),
  getComponent: mapTextComponent
})(AntdDatePicker)

DatePicker.RangePicker = connect({
  getValueFromEvent(_, [startDate, endDate]) {
    const props = this.props || {}
    const format =
      props.format || (props.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
    return [
      transformMoment(startDate, format),
      transformMoment(endDate, format)
    ]
  },
  getProps: compose(mapStyledProps, mapMomentValue),
  getComponent: mapTextComponent
})(AntdDatePicker.RangePicker)

DatePicker.MonthPicker = connect({
  getValueFromEvent(_, value) {
    return transformMoment(value)
  },
  getProps: compose(mapStyledProps, mapMomentValue),
  getComponent: mapTextComponent
})(AntdDatePicker.MonthPicker)

DatePicker.WeekPicker = connect({
  getValueFromEvent(_, value) {
    return transformMoment(value, 'gggg-wo')
  },
  getProps: compose(mapStyledProps, props => {
    if (isStr(props.value) && props.value) {
      const parsed = props.value.match(/\D*(\d+)\D*(\d+)\D*/) || ['', '', '']
      props.value = moment(parsed[1], 'YYYY').add(parsed[2] - 1, 'weeks')
    }
    return props
  }),
  getComponent: mapTextComponent
})(AntdDatePicker.WeekPicker)

DatePicker.YearPicker = connect({
  getValueFromEvent(_, value) {
    return transformMoment(value, 'YYYY')
  },
  getProps: compose(mapStyledProps, mapMomentValue),
  getComponent: mapTextComponent
})(YearPicker)

export default DatePicker
