import {
  DetailsBlockProvider,
  useDetailsPaginationProps,
  useDetailsWithPaginationDecoratorProps,
  useDetailsWithPaginationProps,
} from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'DetailsBlockProvider',
    'x-use-decorator-props': 'useDetailsWithPaginationDecoratorProps',
    'x-decorator-props': {
      collection: 'roles',
      action: 'list',
      params: {
        pageSize: 1,
      },
    },
    'x-component': 'CardItem',
    properties: {
      details: {
        type: 'void',
        'x-pattern': 'readPretty',
        'x-component': 'Details',
        'x-use-component-props': 'useDetailsWithPaginationProps',
        properties: {
          name: {
            type: 'string',
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-index': 1,
          },
          title: {
            type: 'string',
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-index': 2,
          },
          pagination: {
            'x-component': 'Pagination',
            'x-read-pretty': false,
            'x-use-component-props': 'useDetailsPaginationProps',
            'x-index': 3,
          },
        },
      },
    },
  },
  appOptions: {
    components: {
      DetailsBlockProvider,
    },
    scopes: {
      useDetailsWithPaginationDecoratorProps,
      useDetailsWithPaginationProps,
      useDetailsPaginationProps,
    },
  },
});

export default App;
