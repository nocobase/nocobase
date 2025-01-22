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

import React from 'react';
import { RemoteSelect, SchemaComponent, Variable, useCollectionFilterOptions, useToken } from '@nocobase/client';
import { FilterDynamicComponent, useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client';
import { useField } from '@formily/react';

function isUserKeyField(field) {
  if (field.isForeignKey) {
    return field.target === 'users';
  }
  return field.collectionName === 'users' && field.name === 'id';
}

export function UsersSelect(props) {
  const valueType = typeof props.value;

  return valueType === 'object' && props.value ? <UsersQuery {...props} /> : <InternalUsersSelect {...props} />;
}

function InternalUsersSelect({ value, onChange }) {
  const scope = useWorkflowVariableOptions({ types: [isUserKeyField] });
  return (
    <Variable.Input scope={scope} value={value} onChange={onChange}>
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
