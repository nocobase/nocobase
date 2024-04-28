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
        default: '#8BBB11',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'ColorPicker',
      },
    },
  },
});

export default App;
