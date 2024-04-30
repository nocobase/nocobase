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
        type: 'number',
        title: 'Test',
        default: 1712016000000,
        'x-decorator': 'FormItem',
        'x-component': 'UnixTimestamp',
      },
      test2: {
        type: 'number',
        title: 'Test(accuracy: second)',
        'x-decorator': 'FormItem',
        default: 1712016000,
        'x-component': 'UnixTimestamp',
        'x-component-props': {
          accuracy: 'second',
        },
      },
    },
  },
});

export default App;
