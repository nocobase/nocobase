import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-component': 'ShowFormData',
    'x-decorator': 'FormV2',
    'x-read-pretty': true,
    properties: {
      test: {
        type: 'string',
        default: 'users',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'CollectionSelect',
      },
    },
  },
});

export default App;
