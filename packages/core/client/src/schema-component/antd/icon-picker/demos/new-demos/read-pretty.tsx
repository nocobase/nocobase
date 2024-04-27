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
        default: 'appstoreoutlined',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'IconPicker',
      },
    },
  },
});

export default App;
