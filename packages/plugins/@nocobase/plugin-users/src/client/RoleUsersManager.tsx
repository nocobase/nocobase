/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { App } from 'antd';
import {
  CollectionProvider_deprecated,
  ResourceActionContext,
  ResourceActionProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useRecord,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';
import { RolesManagerContext } from '@nocobase/plugin-acl/client';
import { useUsersTranslation } from './locale';
import { getRoleUsersSchema, userCollection } from './schemas/users';
import { useFilterActionProps } from './hooks';

const useRemoveUser = () => {
  const api = useAPIClient();
  const { role } = useContext(RolesManagerContext);
  const record = useRecord();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      try {
        await api.resource('roles.users', role?.name).remove({
          values: [record['id']],
        });
        refresh();
      } catch (error) {
        // Error notification is already handled by APIClient
        // Just prevent the refresh from being called
        console.error('Failed to remove user from role:', error);
      }
    },
  };
};

const useBulkRemoveUsers = () => {
  const { t } = useUsersTranslation();
  const { message } = App.useApp();
  const api = useAPIClient();
  const { state, setState, refresh } = useResourceActionContext();
  const { role } = useContext(RolesManagerContext);

  return {
    async run() {
      const selected = state?.selectedRowKeys;
      if (!selected?.length) {
        message.warning(t('Please select users'));
        return;
      }
      try {
        await api.resource('roles.users', role?.name).remove({
          values: selected,
        });
        setState?.({ selectedRowKeys: [] });
        refresh();
      } catch (error) {
        // Error notification is already handled by APIClient
        // Just prevent the refresh from being called
        console.error('Failed to remove users from role:', error);
      }
    },
  };
};

const RoleUsersProvider: React.FC = (props) => {
  const { role } = useContext(RolesManagerContext);
  return (
    <ResourceActionProvider
      collection={userCollection}
      request={{
        resource: `users`,
        action: 'listExcludeRole',
        params: {
          roleName: role?.name,
        },
      }}
    >
      {props.children}
    </ResourceActionProvider>
  );
};

export const RoleUsersManager: React.FC = () => {
  const { t } = useUsersTranslation();
  const { role } = useContext(RolesManagerContext);
  const service = useRequest(
    {
      resource: 'roles.users',
      resourceOf: role?.name,
      action: 'list',
    },
    {
      ready: !!role,
    },
  );
  useEffect(() => {
    service.run();
  }, [role]);

  const selectedRoleUsers = useRef([]);
  const handleSelectRoleUsers = (_: number[], rows: any[]) => {
    selectedRoleUsers.current = rows;
  };

  const useAddRoleUsers = () => {
    const { role } = useContext(RolesManagerContext);
    const api = useAPIClient();
    const { setVisible } = useActionContext();
    const { refresh } = useResourceActionContext();
    return {
      async run() {
        await api.resource('roles.users', role?.name).add({
          values: selectedRoleUsers.current.map((user) => user.id),
        });
        selectedRoleUsers.current = [];
        setVisible(false);
        refresh();
      },
    };
  };

  const schema = useMemo(() => getRoleUsersSchema(), [role]);

  return (
    <ResourceActionContext.Provider value={{ ...service }}>
      <CollectionProvider_deprecated collection={userCollection}>
        <SchemaComponent
          schema={schema}
          components={{ RoleUsersProvider }}
          scope={{
            useBulkRemoveUsers,
            useRemoveUser,
            handleSelectRoleUsers,
            useAddRoleUsers,
            useFilterActionProps,
            t,
          }}
        />
      </CollectionProvider_deprecated>
    </ResourceActionContext.Provider>
  );
};
