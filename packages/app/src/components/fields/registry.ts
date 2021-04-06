import { registerFormFields } from '@formily/antd';
import { TimePicker } from './time-picker';
import { Transfer } from './transfer';
import { Switch } from './switch';
import { ArrayCards } from './array-cards';
import { ArrayTable } from './array-table';
import { Checkbox } from './checkbox';
import { DatePicker } from './date-picker';
import { Input } from './input';
import { NumberPicker, Percent } from './number-picker';
import { Password } from './password';
import { Radio } from './radio';
import { Range } from './range';
import { Rating } from './rating';
import { Upload } from './upload';
import { Filter } from './filter';
import { RemoteSelect } from './remote-select';
import { DrawerSelect } from './drawer-select';
import { SubTable } from './sub-table';
import { Cascader } from './cascader';
import { Icon } from './icons';
import { ColorSelect } from './color-select';
import { Permissions } from './permissions';
import { Values } from './values';
import { Automations } from './automations';
import { Wysiwyg } from './wysiwyg';
import { Markdown } from './markdown';

export const setup = () => {
  registerFormFields({
    time: TimePicker,
    timerange: TimePicker.RangePicker,
    transfer: Transfer,
    cascader: Cascader,
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
    select: Input,
    icon: Icon,
    textarea: Input.TextArea,
    number: NumberPicker,
    percent: Percent,
    password: Password,
    radio: Radio.Group,
    range: Range,
    rating: Rating,
    upload: Upload,
    filter: Filter,
    remoteSelect: RemoteSelect,
    drawerSelect: DrawerSelect,
    colorSelect: ColorSelect,
    subTable: SubTable,
    values: Values,
    wysiwyg: Wysiwyg,
    markdown: Markdown,
    'permissions.actions': Permissions.Actions,
    'permissions.fields': Permissions.Fields,
    'permissions.tabs': Permissions.Tabs,
    'automations.datetime': Automations.DateTime,
    'automations.endmode': Automations.EndMode,
    'automations.cron': Automations.Cron,
  });
};
