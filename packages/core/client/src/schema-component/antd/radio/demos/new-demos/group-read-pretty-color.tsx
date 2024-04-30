import { getAppComponent } from '@nocobase/test/web';

const options = [
  {
    label: '男',
    value: 1,
    color: 'blue',
  },
  {
    label: '女',
    value: 2,
    color: 'red',
  },
];
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
        default: 2,
        title: 'Test',
        enum: options,
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
      },
    },
  },
});

export default App;
