import { registerFormFields } from '@formily/antd'
import { TimePicker } from './time-picker'
import { Transfer } from './transfer'
import { Switch } from './switch'
import { ArrayCards } from './array-cards'
import { ArrayTable } from './array-table'
import { Checkbox } from './checkbox'
import { DatePicker } from './date-picker'
import { Input } from './input'
import { NumberPicker, Percent } from './number-picker'
import { Password } from './password'
import { Radio } from './radio'
import { Range } from './range'
import { Rating } from './rating'
import { Upload } from './upload'
import { Filter } from './filter'
import { DrawerSelect } from './drawer-select'
import { SubTable } from './sub-table'

export const setup = () => {
  registerFormFields({
    time: TimePicker,
    timerange: TimePicker.RangePicker,
    transfer: Transfer,
    boolean: Checkbox,
    switch: Switch,
    checkbox: Checkbox,
    array: ArrayCards,
    cards: ArrayCards,
    table: ArrayTable,
    checkboxes: Checkbox.Group,
    date: DatePicker,
    daterange: DatePicker.RangePicker,
    year: DatePicker.YearPicker,
    month: DatePicker.MonthPicker,
    week: DatePicker.WeekPicker,
    string: Input,
    icon: Input,
    textarea: Input.TextArea,
    number: NumberPicker,
    percent: Percent,
    password: Password,
    radio: Radio.Group,
    range: Range,
    rating: Rating,
    upload: Upload,
    filter: Filter,
    drawerSelect: DrawerSelect,
    subTable: SubTable,
  })
}
