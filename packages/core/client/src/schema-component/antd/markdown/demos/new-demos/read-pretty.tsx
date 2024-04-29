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
        type: 'boolean',
        title: 'Test',
        default: '# Title\ncontent',
        'x-decorator': 'FormItem',
        'x-component': 'Markdown',
      },
    },
  },
});

export default App;
