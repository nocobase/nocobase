import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-pattern': 'readPretty',
    properties: {
      test: {
        type: 'string',
        title: 'Test',
        default: ['17:02:18', '18:45:24'],
        'x-decorator': 'FormItem',
        'x-component': 'TimePicker.RangePicker',
      },
    },
  },
});

export default App;
