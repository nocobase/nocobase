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
        type: 'number',
        default:
          '<p>Hello <a href="https://www.nocobase.com" rel="noopener noreferrer" target="_blank">NocoBase</a></p>',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'RichText',
      },
    },
  },
});

export default App;
