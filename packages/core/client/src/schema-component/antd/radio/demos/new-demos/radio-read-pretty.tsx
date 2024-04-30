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
        type: 'boolean',
        title: 'Test1',
        default: true,
        'x-decorator': 'FormItem',
        'x-component': 'Radio',
      },
      test2: {
        type: 'boolean',
        title: 'Test2',
        default: false,
        'x-decorator': 'FormItem',
        'x-component': 'Radio',
      },
    },
  },
});

export default App;
