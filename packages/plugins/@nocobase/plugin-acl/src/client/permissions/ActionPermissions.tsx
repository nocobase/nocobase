/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useForm } from '@formily/react';
import {
  CollectionContext,
  CollectionProvider_deprecated,
  ResourceActionContext,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useFilterFieldOptions,
  useFilterFieldProps,
  useRecord,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';
import React, { useContext, useEffect, useRef } from 'react';
import { RolesManagerContext } from '../RolesManagerProvider';
import { roleCollectionsSchema } from '../schemas/roles';
import { RolesResourcesActions } from './RolesResourcesActions';

const collection = {
  name: 'collections',
  targetKey: 'name',
  filterTargetKey: 'name',
  fields: [
    {
      type: 'integer',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Collection display name")}}',
        type: 'number',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{t("Collection name")}}',
        type: 'string',
        'x-component': 'Input',
      } as ISchema,
    },
    {
      type: 'string',
      name: 'type',
      interface: 'input',
      uiSchema: {
        title: '{{t("Resource type")}}',
        type: 'string',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Collection")}}', value: 'collection', color: 'green' },
          { label: '{{t("Association")}}', value: 'association', color: 'blue' },
        ],
      } as ISchema,
    },
    {
      type: 'string',
      name: 'usingConfig',
      interface: 'input',
      uiSchema: {
        title: '{{t("Permission policy")}}',
        type: 'string',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Individual")}}', value: 'resourceAction', color: 'orange' },
          { label: '{{t("General")}}', value: 'strategy', color: 'default' },
        ],
      } as ISchema,
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      collectionName: 'collections',
      sourceKey: 'name',
      targetKey: 'name',
      uiSchema: {},
    },
  ],
};

const useFilterActionProps = () => {
  const collection = useContext(CollectionContext);
  const options = useFilterFieldOptions(collection.fields);
  const service = useResourceActionContext();
  return useFilterFieldProps({
    options: options.filter((option) => ['title', 'name'].includes(option.name)),
    params: service.state?.params?.[0] || service.params,
    service,
  });
};

const useSaveRoleResourceAction = () => {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      await api.resource('roles.resources', record.roleName)[record.exists ? 'update' : 'create']({
        filterByTk: record.name,
        values: {
          ...form.values,
          name: record.name,
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};

const useRoleResourceValues = (options: any) => {
  const record = useRecord();
  const api = useAPIClient();
  const { visible } = useActionContext();
  const latestRecordRef = useRef({
    roleName: record.roleName,
    name: record.name,
    exists: record.exists,
  });
  latestRecordRef.current = {
    roleName: record.roleName,
    name: record.name,
    exists: record.exists,
  };
  const result = useRequest(
    async (roleName: string, name: string, exists: boolean) => {
      if (!exists) {
        return { data: {} };
      }
      const response = await api.resource('roles.resources', roleName).get({
        appends: ['actions', 'actions.scope'],
        filterByTk: name,
      });
      return response?.data;
    },
    {
      ...options,
      manual: true,
      onSuccess(data, params) {
        const [roleName, name, exists] = params || [];
        const latest = latestRecordRef.current;
        if (latest.roleName !== roleName || latest.name !== name || latest.exists !== exists) {
          return;
        }
        options.onSuccess?.(data);
      },
    },
  );
  useEffect(() => {
    if (visible) {
      result.run(record.roleName, record.name, record.exists);
    }
  }, [visible, record.roleName, record.name, record.exists]);
  return result;
};

export const ActionPermissions: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const { role } = useContext(RolesManagerContext);
  const service = useRequest(
    {
      resource: 'roles.collections',
      resourceOf: role.name,
      action: 'list',
      params: {
        pageSize: 20,
        filter: { hidden: { $isFalsy: true } },
        sort: ['sort'],
      },
    },
    {
      ready: !!role && active,
      refreshDeps: [role?.name],
    },
  );
  return (
    <ResourceActionContext.Provider value={{ ...service }}>
      <CollectionProvider_deprecated collection={collection}>
        <SchemaComponent
          schema={roleCollectionsSchema}
          components={{ RolesResourcesActions }}
          scope={{ useFilterActionProps, useSaveRoleResourceAction, useRoleResourceValues }}
        />
      </CollectionProvider_deprecated>
    </ResourceActionContext.Provider>
  );
};
