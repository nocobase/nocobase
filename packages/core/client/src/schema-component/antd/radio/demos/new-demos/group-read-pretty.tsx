import { getAppComponent } from '@nocobase/test/web';

const options = [
  {
    label: '男',
    value: 1,
  },
  {
    label: '女',
    value: 2,
  },
];

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-read-pretty': true,
    properties: {
      test: {
        type: 'number',
        title: 'Test',
        enum: options,
        default: 1,
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
      },
    },
  },
});

export default App;
