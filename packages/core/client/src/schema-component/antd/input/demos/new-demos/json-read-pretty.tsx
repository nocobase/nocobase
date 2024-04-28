import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-read-pretty': true,
    properties: {
      test: {
        type: 'string',
        title: 'Test',
        default: { a: 1, b: 2 },
        'x-decorator': 'FormItem',
        'x-component': 'Input.JSON',
      },
    },
  },
});

export default App;
