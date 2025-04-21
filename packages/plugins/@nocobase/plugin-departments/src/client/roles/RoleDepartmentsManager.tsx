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

import React, { useContext, useEffect, useMemo } from 'react';
import { App } from 'antd';
import { useDepartmentTranslation } from '../locale';
import {
  CollectionManagerContext,
  CollectionProvider_deprecated,
  ResourceActionContext,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useRecord,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';
import { RolesManagerContext } from '@nocobase/plugin-acl/client';
import { departmentCollection } from '../collections/departments';
import { getDepartmentsSchema } from './schemas/departments';
import { useFilterActionProps } from '../hooks';
import { DepartmentTable } from '../departments/DepartmentTable';
import { useForm } from '@formily/react';

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

const useDataSource = (options?: any) => {
  const defaultRequest = {
    resource: 'departments',
    action: 'list',
    params: {
      // filter: {
      //   parentId: null,
      // },
      appends: ['roles', 'parent(recursively=true)'],
      sort: ['createdAt'],
    },
  };
  const service = useRequest(defaultRequest, options);
  return {
    ...service,
    defaultRequest,
  };
};

const useDisabled = () => {
  const { role } = useContext(RolesManagerContext);
  return {
    disabled: (record: any) => record?.roles?.some((r: { name: string }) => r.name === role?.name),
  };
};

const useAddDepartments = () => {
  const { role } = useContext(RolesManagerContext);
  const api = useAPIClient();
  const form = useForm();
  const { setVisible } = useActionContext();
  const { refresh } = useResourceActionContext();
  const { departments } = form.values || {};
  return {
    async run() {
      await api.resource('roles.departments', role.name).add({
        values: departments.map((dept: any) => dept.id),
      });
      form.reset();
      setVisible(false);
      refresh();
    },
  };
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
    },
  );

  useEffect(() => {
    service.run();
  }, [role]);

  const schema = useMemo(() => getDepartmentsSchema(), [role]);

  return (
    <ResourceActionContext.Provider value={{ ...service }}>
      <CollectionProvider_deprecated collection={departmentCollection}>
        <SchemaComponent
          schema={schema}
          components={{ DepartmentTable, DepartmentTitle }}
          scope={{
            useFilterActionProps,
            t,
            useRemoveDepartment,
            useBulkRemoveDepartments,
            useDataSource,
            useDisabled,
            useAddDepartments,
          }}
        />
      </CollectionProvider_deprecated>
    </ResourceActionContext.Provider>
  );
};
