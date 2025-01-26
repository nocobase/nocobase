/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { cloneDeep } from 'lodash';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { Plugin } from '../application/Plugin';
import { useCollectionManager_deprecated } from '../collection-manager';
import { DEFAULT_DATA_SOURCE_KEY } from '../data-source';
import { BlockTemplate } from './BlockTemplate';

export const SchemaTemplateManagerContext = createContext<any>({});
SchemaTemplateManagerContext.displayName = 'SchemaTemplateManagerContext';

const regenerateUid = (s: ISchema) => {
  s['name'] = s['x-uid'] = uid();
  Object.keys(s.properties || {}).forEach((key) => {
    regenerateUid(s.properties[key]);
  });
};

export const useSchemaTemplate = () => {
  const { getTemplateBySchema } = useSchemaTemplateManager();
  const fieldSchema = useFieldSchema();
  const schemaId = fieldSchema['x-uid'];
  const templateKey = fieldSchema['x-template-key'];
  // console.log('templateKey', { schemaId, templateKey })
  return useMemo(() => getTemplateBySchema(fieldSchema), [schemaId, templateKey]);
};

export const useSchemaTemplateManager = () => {
  const { getInheritCollections } = useCollectionManager_deprecated();
  const { refresh, templates = [] } = useContext(SchemaTemplateManagerContext);
  const api = useAPIClient();
  return {
    templates,
    refresh,
    getTemplateSchemaByMode: useCallback(
      async (options) => {
        const { mode, template } = options;
        if (mode === 'copy') {
          const { data } = await api.request({
            url: `/uiSchemas:getJsonSchema/${template.uid}?includeAsyncNode=true`,
          });
          const s = data?.data || {};
          regenerateUid(s);
          return cloneDeep(s);
        } else if (mode === 'reference') {
          return {
            type: 'void',
            'x-component': 'BlockTemplate',
            'x-component-props': {
              templateId: template.key,
            },
          };
        }
      },
      [api],
    ),
    copyTemplateSchema: useCallback(
      async (template) => {
        const { data } = await api.request({
          url: `/uiSchemas:getJsonSchema/${template.uid}?includeAsyncNode=true`,
        });
        const s = data?.data || {};
        regenerateUid(s);
        return cloneDeep(s);
      },
      [api],
    ),
    saveAsTemplate: useCallback(
      async (values) => {
        const { uid: schemaId } = values;
        const key = uid();
        await api.resource('uiSchemas').saveAsTemplate({
          filterByTk: schemaId,
          values: {
            key,
            ...values,
          },
        });
        await refresh();
        return { key };
      },
      [api, refresh],
    ),
    getTemplateBySchema: useCallback(
      (schema) => {
        if (!schema) return;
        const templateKey = schema['x-template-key'];
        if (templateKey) {
          return templates?.find((template) => template.key === templateKey);
        }
        const schemaId = schema['x-uid'];
        if (schemaId) {
          return templates?.find((template) => template.uid === schemaId);
        }
      },
      [templates],
    ),
    getTemplateBySchemaId: useCallback(
      (schemaId) => {
        if (!schemaId) {
          return null;
        }
        return templates?.find((template) => template.uid === schemaId);
      },
      [templates],
    ),
    getTemplateById: useCallback(
      (key) => {
        return templates?.find((template) => template.key === key);
      },
      [templates],
    ),
    getTemplatesByCollection: useCallback(
      (dataSource: string, collectionName: string) => {
        const parentCollections = getInheritCollections(collectionName, dataSource);
        const totalCollections = parentCollections.concat([collectionName]);
        const items = templates?.filter?.(
          (template) =>
            (template.dataSourceKey || DEFAULT_DATA_SOURCE_KEY) === dataSource &&
            totalCollections.includes(template.collectionName),
        );
        return items || [];
      },
      [getInheritCollections, templates],
    ),
    getTemplatesByComponentName: useCallback(
      (componentName: string): Array<any> => {
        const items = templates?.filter?.((template) => template.componentName === componentName);
        return items || [];
      },
      [templates],
    ),
  };
};

const options = {
  resource: 'uiSchemaTemplates',
  action: 'list',
  params: {
    // appends: ['collection'],
    paginate: false,
  },
  refreshDeps: [],
};
export const RemoteSchemaTemplateManagerProvider = (props) => {
  const api = useAPIClient();

  const service = useRequest<{
    data: any[];
  }>(options);

  const refresh = useCallback(async () => {
    const { data } = await api.request(options);
    service.mutate(data);
  }, [api, service]);

  const value = useMemo(() => ({ templates: service?.data?.data, refresh }), [service?.data?.data, refresh]);

  return <SchemaTemplateManagerContext.Provider value={value}>{props.children}</SchemaTemplateManagerContext.Provider>;
};

export class RemoteSchemaTemplateManagerPlugin extends Plugin {
  async load() {
    this.addRoutes();
    this.addComponents();
  }

  addComponents() {
    this.app.addComponents({
      BlockTemplate,
    });
  }

  addRoutes() {
    this.app.router.add('admin.plugins.block-templates-key', {
      path: '/admin/plugins/block-templates/:key',
      Component: 'BlockTemplateDetails',
    });
  }
}
