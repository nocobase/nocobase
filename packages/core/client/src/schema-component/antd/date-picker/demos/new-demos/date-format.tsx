import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'string',
        title: 'Test',
        default: '2024-01-01 10:10:10',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker',
        'x-component-props': {
          format: 'YYYY/MM/DD',
        },
      },
    },
  },
});

export default App;
