/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
