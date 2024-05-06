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
        type: 'string',
        title: 'Test',
        default: 'rdQ1G9iPEtjR6BpIAPilZ',
        'x-decorator': 'FormItem',
        'x-component': 'NanoIDInput',
      },
    },
  },
});

export default App;
