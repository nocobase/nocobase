import { BlockSchemaComponentPlugin } from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  designable: true,
  enableUserListDataBlock: true,
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormBlockProvider',
    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
    'x-decorator-props': {
      collection: 'users',
    },
    'x-component': 'FormV2',
    'x-use-component-props': 'useCreateFormBlockProps',
    properties: {
      nickname: {
        default: 'aaa',
        'x-pattern': 'readPretty',
        'x-component': 'CollectionField',
        'x-decorator': 'QuickEdit',
        'x-decorator-props': {
          labelStyle: {
            display: 'none',
          },
        },
      },
    },
  },
  appOptions: {
    plugins: [BlockSchemaComponentPlugin],
  },
});

export default App;
