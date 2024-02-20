import React, { useContext } from 'react';
import { App } from 'antd';
import { useDepartmentTranslation } from '../locale';
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
import { departmentCollection } from '../collections/departments';
import { departmentsSchema } from './schemas/departments';
import { useFilterActionProps } from '../hooks';
import { AddDepartments, useAddDepartments } from './AddDepartments';

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
  const { t } = useDepartmentTranslation();
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

const DepartmentTitle: React.FC = () => {
  const record = useRecord();
  const getTitle = (record: any) => {
    const title = record.title;
    const parent = record.parent;
    if (parent) {
      return getTitle(parent) + ' / ' + title;
    }
    return title;
  };

  return <>{getTitle(record)}</>;
};

export const RoleDepartmentsManager: React.FC = () => {
  const { t } = useDepartmentTranslation();
  const { role } = useContext(RolesManagerContext);
  const service = useRequest(
    {
      resource: `roles/${role?.name}/departments`,
      action: 'list',
      params: {
        appends: ['parent', 'parent.parent(recursively=true)'],
      },
    },
    {
      ready: !!role,
      refreshDeps: [role],
    },
  );

  return (
    <ResourceActionContext.Provider value={{ ...service }}>
      <CollectionProvider collection={departmentCollection}>
        <SchemaComponent
          schema={departmentsSchema}
          components={{ AddDepartments, DepartmentTitle }}
          scope={{
            useFilterActionProps,
            t,
            useAddDepartments,
            useRemoveDepartment,
            useBulkRemoveDepartments,
          }}
        />
      </CollectionProvider>
    </ResourceActionContext.Provider>
  );
};
