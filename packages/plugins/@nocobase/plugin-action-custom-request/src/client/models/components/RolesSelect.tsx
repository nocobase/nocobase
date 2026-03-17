/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client';
import React from 'react';
import { normalizeRoleNames } from '../utils';

export const RolesSelect = (props: { value?: string[]; onChange?: (value: string[]) => void }) => {
  const { value = [], onChange } = props;

  return (
    <RemoteSelect
      mode="multiple"
      manual={false}
      value={value}
      service={{
        resource: 'roles',
      }}
      fieldNames={{
        label: 'title',
        value: 'name',
      }}
      allowClear
      onChange={(next) => onChange?.(normalizeRoleNames(next))}
    />
  );
};
