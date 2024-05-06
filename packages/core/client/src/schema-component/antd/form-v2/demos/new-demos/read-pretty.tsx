import { CollectionField, FormBlockProvider, useFormBlockProps } from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'FormBlockProvider',
        'x-component-props': {
          collection: 'users',
          action: 'get',
          filterByTk: 1,
          dataSource: 'main',
        },
        properties: {
          form: {
            type: 'void',
            'x-component': 'FormV2',
            'x-use-component-props': 'useFormBlockProps',
            'x-pattern': 'readPretty', // 增加 x-read-pretty 属性
            properties: {
              username: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'CollectionField',
              },
              nickname: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'CollectionField',
              },
            },
          },
        },
      },
    },
  },
  appOptions: {
    scopes: {
      useFormBlockProps,
    },
    components: {
      FormBlockProvider,
      CollectionField,
    },
  },
});

export default App;
