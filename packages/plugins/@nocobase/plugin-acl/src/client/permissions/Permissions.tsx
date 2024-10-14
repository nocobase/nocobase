/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useACLRoleContext, useAPIClient, usePlugin, useRequest } from '@nocobase/client';
import { Tabs } from 'antd';
import React, { useContext, useEffect, useMemo } from 'react';
import PluginACLClient from '..';
import { Role, RolesManagerContext } from '../RolesManagerProvider';
import { useACLTranslation } from '../locale';
import { AvailableActionsProvider } from './AvailableActions';

const TabLayout: React.FC = (props) => {
  return <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>{props.children}</div>;
};

export const Permissions: React.FC<{ active: boolean }> = ({ active }) => {
  const { t } = useACLTranslation();
  const [activeKey, setActiveKey] = React.useState('general');
  const { role, setRole } = useContext(RolesManagerContext);
  const pluginACLClient = usePlugin(PluginACLClient);
  const currentUserRole = useACLRoleContext();
  const items = useMemo(
    () =>
      pluginACLClient.settingsUI
        .getPermissionsTabs({ t, activeKey, TabLayout, activeRole: role, currentUserRole })
        .filter(Boolean),
    [activeKey, pluginACLClient.settingsUI, role, t, currentUserRole],
  );

  const api = useAPIClient();
  const { data } = useRequest<Role>(
    () =>
      api
        .resource('roles')
        .get({
          filterByTk: role?.name,
        })
        .then((res) => {
          const record = res?.data?.data;
          record.snippets?.forEach((key: string) => {
            record[key] = true;
          });
          return record;
        }),
    {
      ready: active && !!role,
      refreshDeps: [role?.name],
    },
  );

  useEffect(() => {
    setActiveKey('general');
  }, [role?.name]);

  useEffect(() => {
    setRole(data);
  }, [data, setRole]);

  return (
    <AvailableActionsProvider>
      <Tabs type="card" activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
    </AvailableActionsProvider>
  );
};
