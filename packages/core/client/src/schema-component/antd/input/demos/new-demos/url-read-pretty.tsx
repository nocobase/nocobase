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
        default: 'https://www.nocobase.com',
        'x-decorator': 'FormItem',
        'x-component': 'Input.URL',
      },
    },
  },
});

export default App;
