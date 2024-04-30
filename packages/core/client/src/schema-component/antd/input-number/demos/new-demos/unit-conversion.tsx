import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-pattern': 'readPretty',
    properties: {
      test1: {
        type: 'number',
        title: 'Test1',
        default: 100,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          unitConversion: 10,
        },
      },
      test2: {
        type: 'number',
        title: 'Test2',
        default: 100,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          unitConversion: 10,
          unitConversionType: '/',
        },
      },
    },
  },
});

export default App;
