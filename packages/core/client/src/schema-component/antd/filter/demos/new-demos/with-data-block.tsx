/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useField, observer } from '@formily/react';
import { FilterActionProps, useDataBlockRequest, useRequest } from '@nocobase/client';

import { getAppComponent } from '@nocobase/test/web';

import { filterOptions } from './options';

const ShowFilterData = observer(({ children }) => {
  const field = useField<any>();
  return (
    <>
      <pre>{JSON.stringify(field.value, null, 2)}</pre>
      {children}
    </>
  );
});

const useFilterActionProps = (): FilterActionProps => {
  const field = useField<any>();
  const { run } = useDataBlockRequest(); // replace `useRequest`

  return {
    options: filterOptions,
    onSubmit: async (values) => {
      console.log('onSubmit', values);

      // request api
      run(values);

      field.setValue(values);
    },
    onReset: (values) => {
      console.log('onReset', values);
    },
  };
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
        enum: filterOptions,
        title: 'Filter',
        'x-decorator': 'ShowFilterData',
        'x-component': 'Filter.Action',
        'x-use-component-props': useFilterActionProps,
      },
    },
  },
  appOptions: {
    components: {
      ShowFilterData,
    },
    scopes: {
      useFilterActionProps,
    },
  },
  apis: {
    test: { data: { data: 'ok' } },
  },
});

export default App;
