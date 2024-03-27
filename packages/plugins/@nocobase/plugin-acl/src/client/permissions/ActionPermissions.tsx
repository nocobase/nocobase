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
import React, { useContext, useEffect } from 'react';
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
  const { visible } = useActionContext();
  const result = useRequest(
    {
      resource: 'roles.resources',
      resourceOf: record.roleName,
      action: 'get',
      params: {
        appends: ['actions', 'actions.scope'],
        filterByTk: record.name,
      },
    },
    { ...options, manual: true },
  );
  useEffect(() => {
    if (!record.exists) {
      options.onSuccess({
        data: {},
      });
      return;
    }
    if (visible) {
      result.run();
    }
  }, [visible, record.exists]);
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
