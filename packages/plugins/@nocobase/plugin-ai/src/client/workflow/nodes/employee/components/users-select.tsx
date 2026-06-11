/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { RemoteSelect, Variable } from '@nocobase/client';
import { useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client';

function isUserKeyField(field) {
  if (field.isForeignKey || field.type === 'context') {
    return field.target === 'users';
  }
  return field.collectionName === 'users' && field.name === 'id';
}

export function UsersSelect({ disabled = false, multiple = false, value, onChange }) {
  const scope = useWorkflowVariableOptions({ types: [isUserKeyField] });

  const handleSelectChanged = (v) => {
    if (multiple) {
      onChange(Array.isArray(v) ? v : [v]);
    } else {
      onChange(v);
    }
  };

  return (
    <Variable.Input
      scope={scope}
      value={value}
      onChange={(next) => {
        onChange([next]);
      }}
    >
      <RemoteSelect
        fieldNames={{
          label: 'nickname',
          value: 'id',
        }}
        service={{
          resource: 'users',
        }}
        manual={false}
        value={value}
        onChange={handleSelectChanged}
        multiple={multiple}
        disabled={disabled}
      />
    </Variable.Input>
  );
}
