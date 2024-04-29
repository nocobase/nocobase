import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'FormV2',
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            properties: {
              row1: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  col1: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      username: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        title: 'Username',
                        required: true,
                      },
                    },
                  },
                  col2: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      nickname: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        title: 'Nickname',
                      },
                    },
                  },
                },
              },
              row2: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  col1: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
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
            },
          },
        },
      },
    },
  },
});

export default App;
