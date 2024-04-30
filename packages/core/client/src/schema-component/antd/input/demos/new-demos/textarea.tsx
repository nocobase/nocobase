import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test1: {
        type: 'string',
        title: 'Test1',
        'x-decorator': 'FormItem',
        'x-component': 'Input.TextArea',
      },
    },
  },
});

export default App;
