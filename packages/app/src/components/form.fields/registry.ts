import { registerFormFields } from '@formily/antd'
import { TimePicker } from './time-picker'
import { Transfer } from './transfer'
import { Switch } from './switch'
import { ArrayCards } from './array-cards'
import { ArrayTable } from './array-table'
import { Checkbox } from './checkbox'
import { DatePicker } from './date-picker'
import { Input } from './input'
import { NumberPicker } from './number-picker'
import { Password } from './password'
import { Radio } from './radio'
import { Range } from './range'
import { Rating } from './rating'
import { Upload } from './upload'

export const setup = () => {
  registerFormFields({
    time: TimePicker,
    timerange: TimePicker.RangePicker,
    transfer: Transfer,
    boolean: Switch,
    array: ArrayCards,
    cards: ArrayCards,
    table: ArrayTable,
    checkbox: Checkbox.Group,
    date: DatePicker,
    daterange: DatePicker.RangePicker,
    year: DatePicker.YearPicker,
    month: DatePicker.MonthPicker,
    week: DatePicker.WeekPicker,
    string: Input,
    textarea: Input.TextArea,
    number: NumberPicker,
    password: Password,
    radio: Radio.Group,
    range: Range,
    rating: Rating,
    upload: Upload
  })
}
