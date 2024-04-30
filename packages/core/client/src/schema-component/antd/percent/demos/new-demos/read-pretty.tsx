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
        default: 1.23,
        'x-decorator': 'FormItem',
        'x-component': 'Percent',
      },
    },
  },
});

export default App;
