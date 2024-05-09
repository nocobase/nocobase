/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { FormProvider, SchemaComponent } from '../../schema-component';
import { scopesSchema } from './schemas/scopes';

const RolesResourcesScopesSelectedRowKeysContext = createContext(null);
RolesResourcesScopesSelectedRowKeysContext.displayName = 'RolesResourcesScopesSelectedRowKeysContext';

const RolesResourcesScopesSelectedRowKeysProvider: React.FC = (props) => {
  const [keys, setKeys] = useState([]);
  return (
    <RolesResourcesScopesSelectedRowKeysContext.Provider value={[keys, setKeys]}>
      {props.children}
    </RolesResourcesScopesSelectedRowKeysContext.Provider>
  );
};

export const useRolesResourcesScopesSelectedRowKeys = () => {
  return useContext(RolesResourcesScopesSelectedRowKeysContext);
};

export const ScopeSelect = (props) => {
  const form = useMemo(
    () =>
      createForm({
        values: {
          scope: props.value,
        },
      }),
    [],
  );
  return (
    <FormProvider form={form}>
      <SchemaComponent
        components={{ RolesResourcesScopesSelectedRowKeysProvider }}
        scope={{
          onChange(value) {
            props?.onChange?.(value);
          },
        }}
        schema={scopesSchema}
      />
    </FormProvider>
  );
};
