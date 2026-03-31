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

import React, { useContext, useRef, useEffect, useMemo } from 'react';
import { useDepartmentTranslation } from '../locale';
import {
  CollectionContext,
  ResourceActionProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useFilterFieldOptions,
  useFilterFieldProps,
  useRecord,
  useResourceActionContext,
  useTableBlockContext,
} from '@nocobase/client';
import { membersActionSchema, addMembersSchema, rowRemoveActionSchema, getMembersSchema } from './schemas/users';
import { App } from 'antd';
import { DepartmentField } from './DepartmentField';
import { IsOwnerField } from './IsOwnerField';
import { UserDepartmentsField } from './UserDepartmentsField';
import { ResourcesContext } from '../ResourcesProvider';
import { useTableBlockProps } from '../hooks/useTableBlockProps';

const AddMembersListProvider: React.FC = (props) => {
  const { department } = useContext(ResourcesContext);
  return (
    <ResourceActionProvider
      {...{
        collection: 'users',
        request: {
          resource: 'users',
          action: 'listExcludeDept',
          params: {
            departmentId: department?.id,
          },
        },
      }}
    >
      {props.children}
    </ResourceActionProvider>
  );
};

const useAddMembersFilterActionProps = () => {
  const collection = useContext(CollectionContext);
  const options = useFilterFieldOptions(collection.fields);
  const service = useResourceActionContext();
  return useFilterFieldProps({
    options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
};

export const AddMembers: React.FC = () => {
  const { department } = useContext(ResourcesContext);
  // This resource is the list of members of the current department.
  const {
    service: { refresh },
  } = useTableBlockContext();
  const selectedKeys = useRef([]);
  const api = useAPIClient();

  const useAddMembersActionProps = () => {
    const { department } = useContext(ResourcesContext);
    const { setVisible } = useActionContext();
    return {
      async onClick() {
        const selected = selectedKeys.current;
        if (!selected?.length) {
          return;
        }
        await api.resource('departments.members', department.id).add({
          values: selected,
        });
        selectedKeys.current = [];
        refresh();
        setVisible?.(false);
      },
    };
  };

  const handleSelect = (keys: any[]) => {
    selectedKeys.current = keys;
  };

  return (
    <SchemaComponent
      scope={{
        useAddMembersActionProps,
        department,
        handleSelect,
        useAddMembersFilterActionProps,
      }}
      components={{ AddMembersListProvider }}
      schema={addMembersSchema}
    />
  );
};

const useBulkRemoveMembersAction = () => {
  const { t } = useDepartmentTranslation();
  const { message } = App.useApp();
  const api = useAPIClient();
  const {
    service: { refresh },
    field,
  } = useTableBlockContext();
  const { department } = useContext(ResourcesContext);
  return {
    async run() {
      const selected = field?.data?.selectedRowKeys;
      if (!selected?.length) {
        message.warning(t('Please select members'));
        return;
      }
      await api.resource('departments.members', department.id).remove({
        values: selected,
      });
      field.data.selectedRowKeys = [];
      refresh();
    },
  };
};

const useRemoveMemberAction = () => {
  const api = useAPIClient();
  const { department } = useContext(ResourcesContext);
  const { id } = useRecord() as any;
  const {
    service: { refresh },
  } = useTableBlockContext();
  return {
    async run() {
      await api.resource('departments.members', department.id).remove({
        values: [id],
      });
      refresh();
    },
  };
};

const useShowTotal = () => {
  const {
    service: { data },
  } = useTableBlockContext();
  const { t } = useDepartmentTranslation();
  return t('Total {{count}} members', { count: data?.meta?.count });
};

const useRefreshActionProps = () => {
  const { service } = useTableBlockContext();
  return {
    async onClick() {
      service?.refresh?.();
    },
  };
};

const RowRemoveAction = () => {
  const { department } = useContext(ResourcesContext);
  return department ? <SchemaComponent scope={{ useRemoveMemberAction }} schema={rowRemoveActionSchema} /> : null;
};

const MemberActions = () => {
  const { department } = useContext(ResourcesContext);
  return department ? <SchemaComponent schema={membersActionSchema} /> : null;
};

const useMemberFilterActionProps = () => {
  const collection = useContext(CollectionContext);
  const options = useFilterFieldOptions(collection.fields);
  const { service } = useTableBlockContext();
  return useFilterFieldProps({
    options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
};

export const Member: React.FC = () => {
  const { t } = useDepartmentTranslation();
  const { department, user } = useContext(ResourcesContext);
  const {
    service: { data, setState },
  } = useTableBlockContext();

  useEffect(() => {
    setState?.({ selectedRowKeys: [] });
  }, [data, setState]);

  const schema = useMemo(() => getMembersSchema(department, user), [department, user]);

  return (
    <>
      {!user ? <h2>{t(department?.title || 'All users')}</h2> : <h2>{t('Search results')}</h2>}
      <SchemaComponent
        scope={{
          useBulkRemoveMembersAction,
          t,
          useShowTotal,
          useRefreshActionProps,
          useMemberFilterActionProps,
          useTableBlockProps,
        }}
        components={{
          MemberActions,
          AddMembers,
          RowRemoveAction,
          DepartmentField,
          IsOwnerField,
          UserDepartmentsField,
        }}
        schema={schema}
      />
    </>
  );
};
