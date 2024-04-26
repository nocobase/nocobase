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
        default: '13 6 11 * *',
        title: 'Test title',
        'x-decorator': 'FormItem',
        'x-component': 'Cron',
      },
    },
  },
});

export default App;
