import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'array',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'CollectionSelect',
        'x-component-props': {
          mode: 'multiple',
        },
      },
    },
  },
});

export default App;
