/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import React from 'react';

type UserOption = { id: number | string; nickname?: string };

export type UserSelectProps = {
  value?: any;
  onChange?: (next: any) => void;
  variableOptions?: any;
};

export function UserSelect(props: UserSelectProps) {
  const { value, onChange } = props;
  const ctx = useFlowContext();

  return (
    <RemoteSelect<UserOption>
      value={value}
      onChange={onChange}
      request={async () => {
        const response = await ctx.api.resource('users').list({
          ...(value != null && typeof value !== 'object' ? { filter: { id: value } } : {}),
        });
        const payload = (response as any)?.data?.data;
        return Array.isArray(payload) ? payload : [];
      }}
      mapOptions={(item) => ({ label: item.nickname || String(item.id), value: item.id })}
    />
  );
}

export default UserSelect;
