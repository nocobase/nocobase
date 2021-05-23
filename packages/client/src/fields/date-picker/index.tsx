import moment from 'moment'
import { connect, mapProps, mapReadPretty } from '@formily/react'
import { DatePicker as AntdDatePicker } from 'antd'
import {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps,
} from 'antd/lib/date-picker'
import { Descriptions } from '../descriptions'
import { formatMomentValue, momentable } from '@formily/antd/esm/__builtins__'

type DatePickerProps<PickerProps> = Exclude<
  PickerProps,
  'value' | 'onChange'
> & {
  value: string
  onChange: (value: string | string[]) => void
}

type ComposedDatePicker = React.FC<AntdDatePickerProps> & {
  RangePicker?: React.FC<RangePickerProps>
}

const mapDateFormat = function () {
  const getDefaultFormat = (props: DatePickerProps<AntdDatePickerProps>) => {
    if (props['picker'] === 'month') {
      return 'YYYY-MM'
    } else if (props['picker'] === 'quarter') {
      return 'YYYY-\\QQ'
    } else if (props['picker'] === 'year') {
      return 'YYYY'
    } else if (props['picker'] === 'week') {
      return 'YYYY-wo'
    }
    return props['showTime'] ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
  }
  return (props: any) => {
    const format = props['format'] || getDefaultFormat(props)
    const onChange = props.onChange
    return {
      ...props,
      format: format,
      value: momentable(props.value, format === 'YYYY-wo' ? 'YYYY-w' : format),
      onChange: (value: moment.Moment | moment.Moment[]) => {
        if (onChange) {
          onChange(formatMomentValue(value, format))
        }
      },
    }
  }
}

export const DatePicker: ComposedDatePicker = connect(
  AntdDatePicker,
  mapProps(mapDateFormat()),
  mapReadPretty(Descriptions.DatePicker)
)

DatePicker.RangePicker = connect(
  AntdDatePicker.RangePicker,
  mapProps(mapDateFormat()),
  mapReadPretty(Descriptions.DateRangePicker)
)

export default DatePicker
