import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'FormV2',
        'x-component-props': {
          layout: 'horizontal', // 'vertical' | 'horizontal' | 'inline
          labelCol: 6,
          wrapperCol: 10,
        },
        properties: {
          username: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Username',
            required: true,
          },
          nickname: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Nickname',
          },
          password: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Password',
          },
        },
      },
    },
  },
});

export default App;
