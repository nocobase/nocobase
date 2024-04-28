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
        default: '0 0 0 * * ?',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'CronSet',
        'x-component-props': {
          options: [
            {
              label: '{{t("Daily")}}',
              value: '0 0 0 * * ?',
            },
            {
              label: '{{t("Weekly")}}',
              value: '* * * * * ?',
            },
          ],
        },
      },
    },
  },
});

export default App;
