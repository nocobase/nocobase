/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { Select } from 'antd';
import React from 'react';
import { normalizeRoleNames } from '../customRequestUtils';

type RoleOption = {
  label: string;
  value: string;
};

export const RolesSelect = (props: { value?: string[]; onChange?: (value: string[]) => void }) => {
  const { value = [], onChange } = props;
  const { api } = useFlowContext();
  const [options, setOptions] = React.useState<RoleOption[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.resource('roles').list({
          pageSize: 200,
          sort: ['createdAt'],
        });
        if (!mounted) {
          return;
        }
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        setOptions(
          data
            .map((item: any) => ({
              label: item?.title || item?.name,
              value: item?.name,
            }))
            .filter((item: RoleOption) => !!item.value),
        );
      } catch (error) {
        if (mounted) {
          setOptions([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [api]);

  return (
    <Select
      mode="multiple"
      allowClear
      options={options}
      value={value}
      onChange={(next) => onChange?.(normalizeRoleNames(next))}
    />
  );
};
