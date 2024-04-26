import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-read-pretty': true,
    properties: {
      test1: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test title1',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
      },
      test2: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test title2',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
        'x-component-props': {
          format: 'YYYY/MM/DD',
        },
      },
      test3: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test title3',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
        'x-component-props': {
          showTime: true,
        },
      },
    },
  },
});

export default App;
