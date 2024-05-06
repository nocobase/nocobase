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
        default: '1.11',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          addonBefore: '¥',
          addonAfter: '万元',
        },
      },
    },
  },
});

export default App;
