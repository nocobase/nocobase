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
        default: '123',
        'x-decorator': 'FormItem',
        'x-component': 'Password',
      },
    },
  },
});

export default App;
