import {
  FilterActionProps,
  useCollection,
  useDataBlockRequest,
  useFilterFieldOptions,
  useFilterFieldProps,
} from '@nocobase/client';

import { getAppComponent } from '@nocobase/test/web';

const useFilterActionProps = (): FilterActionProps => {
  const service = useDataBlockRequest();
  const collection = useCollection();
  const options = useFilterFieldOptions(collection.fields);
  return useFilterFieldProps({
    options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
};

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'DataBlockProvider',
    'x-decorator-props': {
      collection: 'users',
      action: 'list',
    },
    properties: {
      test: {
        name: 'filter',
        type: 'object',
        title: 'Filter',
        'x-component': 'Filter.Action',
        'x-use-component-props': useFilterActionProps,
      },
    },
  },
  appOptions: {
    components: {},
    scopes: {
      useFilterActionProps,
    },
  },
  apis: {
    test: { data: { data: 'ok' } },
  },
});

export default App;
