import React, { useContext } from 'react';
import { App } from 'antd';
import {
  CollectionProvider,
  ResourceActionContext,
  SchemaComponent,
  useAPIClient,
  useRecord,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';
import { RolesManagerContext } from '@nocobase/plugin-acl/client';
import { useUsersTranslation } from './locale';
import { roleUsersSchema, userCollection } from './schemas/users';

const useRemoveDepartment = () => {
  const api = useAPIClient();
  const { role } = useContext(RolesManagerContext);
  const { id } = useRecord();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      await api.resource(`roles/${role?.name}/departments`).remove({
        values: [id],
      });
      refresh();
    },
  };
};

const useBulkRemoveDepartments = () => {
  const { t } = useUsersTranslation();
  const { message } = App.useApp();
  const api = useAPIClient();
  const { state, setState, refresh } = useResourceActionContext();
  const { role } = useContext(RolesManagerContext);

  return {
    async run() {
      const selected = state?.selectedRowKeys;
      if (!selected?.length) {
        message.warning(t('Please select departments'));
        return;
      }
      await api.resource(`roles/${role?.name}/departments`).remove({
        values: selected,
      });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
};

export const RoleUsersManager: React.FC = () => {
  const { t } = useUsersTranslation();
  const { role } = useContext(RolesManagerContext);
  const service = useRequest(
    {
      resource: `roles/${role?.name}/users`,
      action: 'list',
    },
    {
      ready: !!role,
      refreshDeps: [role],
    },
  );

  return (
    <ResourceActionContext.Provider value={{ ...service }}>
      <CollectionProvider collection={userCollection}>
        <SchemaComponent
          schema={roleUsersSchema}
          scope={{
            t,
          }}
        />
      </CollectionProvider>
    </ResourceActionContext.Provider>
  );
};
