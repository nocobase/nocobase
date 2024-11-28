/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { useCallback } from 'react';
import { RemoteSelect, SchemaComponent, Variable, useCollectionFilterOptions, useToken } from '@nocobase/client';
import { useField } from '@formily/react';

function InternalUsersSelect({ value, onChange, variableOptions }) {
  return (
    <Variable.Input scope={variableOptions} value={value} onChange={onChange}>
      <RemoteSelect
        fieldNames={{
          label: 'nickname',
          value: 'id',
        }}
        service={{
          resource: 'users',
          defaultParams: value ? { filter: { id: value } } : undefined,
        }}
        manual={false}
        value={value}
        onChange={onChange}
      />
    </Variable.Input>
  );
}

function UsersQuery(props) {
  const field = useField<any>();
  const options = useCollectionFilterOptions('users');
  const { token } = useToken();
  const FilterDynamicComponent = useCallback(
    ({ value, onChange, renderSchemaComponent }) => {
      return (
        <Variable.Input value={value} onChange={onChange} scope={props.variableOptions}>
          {renderSchemaComponent()}
        </Variable.Input>
      );
    },
    [props.variableOptions],
  );

  return (
    <div
      style={{
        border: `1px dashed ${token.colorBorder}`,
        padding: token.paddingSM,
      }}
    >
      <SchemaComponent
        basePath={field.address}
        schema={{
          type: 'void',
          properties: {
            filter: {
              type: 'object',
              'x-component': 'Filter',
              'x-component-props': {
                options,
                dynamicComponent: FilterDynamicComponent,
              },
            },
          },
        }}
      />
    </div>
  );
}

export default function UserSelect(props) {
  const valueType = typeof props.value;

  return valueType === 'object' && props.value ? <UsersQuery {...props} /> : <InternalUsersSelect {...props} />;
}
