/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useRequest,
  useAPIClient,
  usePlugin,
  registerInitializerMenusGenerator,
  useResource,
  ISchema,
  SchemaInitializerItemType,
  useCurrentUserContext,
} from '@nocobase/client';
import React, { createContext, useContext, useEffect } from 'react';
import PluginBlockTemplateClient from '..';
import PluginMobileClient from '@nocobase/plugin-mobile/client';
import { useT } from '../locale';
import { findBlockRootSchema } from '../utils/schema';
import { convertTemplateToBlock, correctIdReferences } from '../initializers/TemplateBlockInitializer';
import { useMemoizedFn } from 'ahooks';
import { useLocation } from 'react-router-dom';

interface BlockTemplateContextProps {
  loading: boolean;
  templates: any[];
  handleTemplateClick: (item: any, options?: any, insert?: any) => Promise<void>;
}

const BlockTemplateMenusContext = createContext<BlockTemplateContextProps>({
  loading: false,
  templates: [],
  handleTemplateClick: async () => {},
});

export const useBlockTemplateMenus = () => {
  return useContext(BlockTemplateMenusContext);
};

export const BlockTemplateMenusProvider = ({ children }) => {
  const api = useAPIClient();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const mobilePlugin = usePlugin(PluginMobileClient);
  const blockTemplatesResource = useResource('blockTemplates');
  const t = useT();
  const isMobile = window.location.pathname.startsWith(mobilePlugin.mobileBasename);
  const location = useLocation();
  const previousPathRef = React.useRef(location.pathname);
  const user = useCurrentUserContext();

  const { data, loading, refresh } = useRequest<{
    data: {
      key: string;
      title: string;
      componentType?: string;
      menuName?: string;
      collection?: string;
      dataSource?: string;
    }[];
  }>(
    {
      url: 'blockTemplates:list',
      method: 'get',
      params: {
        filter: {
          configured: { $isTruly: true },
          type: isMobile ? 'Mobile' : { $ne: 'Mobile' },
        },
        paginate: false,
      },
    },
    {
      cacheKey: 'blockTemplates',
      manual: true,
    },
  );

  useEffect(() => {
    const isLeavingTemplatesPage =
      previousPathRef.current.includes('/settings/block-templates/inherited') &&
      !location.pathname.includes('/settings/block-templates/inherited');
    if (isLeavingTemplatesPage) {
      refresh();
    }
    previousPathRef.current = location.pathname;
  }, [location.pathname, refresh]);

  useEffect(() => {
    if (user?.data) {
      refresh();
    }
  }, [user, refresh]);

  const handleTemplateClick = useMemoizedFn(async ({ item }, options?: any, insert?: any) => {
    const { uid } = item;
    const { data } = await api.request({
      url: `uiSchemas:getProperties/${uid}`,
    });

    const template = data?.data;
    const schemas = convertTemplateToBlock(template, item.key, options);
    plugin.setTemplateCache(findBlockRootSchema(template['properties']?.['blocks']));
    correctIdReferences(schemas);
    for (const schema of schemas) {
      insert?.(schema);
    }
    // server hook only support root node, so we do the link from client
    const links = [];
    const fillLink = (schema: ISchema) => {
      if (schema['x-template-root-uid']) {
        links.push({
          templateKey: item.key,
          templateBlockUid: schema['x-template-root-uid'],
          blockUid: schema['x-uid'],
        });
      }
      if (schema.properties) {
        for (const key in schema.properties) {
          fillLink(schema.properties[key]);
        }
      }
    };
    for (const schema of schemas) {
      fillLink(schema);
    }
    blockTemplatesResource.link({
      values: links,
    });
  });

  useEffect(() => {
    data?.data?.forEach((item) => {
      plugin.templateInfos.set(item.key, item);
    });
  }, [data?.data, plugin.templateInfos]);

  useEffect(() => {
    const generator = ({ collection, association, item, index, field, componentName, dataSource, keyPrefix, name }) => {
      let collectionName = collection?.name || item?.options?.name;
      const dataSourceName = dataSource || item?.options?.dataSource || collection?.dataSource;
      const isInWorkflowPage = window.location.pathname.includes('/admin/workflow');

      if (componentName?.startsWith('mobile-')) {
        componentName = componentName.replace('mobile-', '');
      }

      if (plugin.isInBlockTemplateConfigPage() || isInWorkflowPage) {
        // hide menu in template config page
        return null;
      }

      if (field) {
        // association field
        collectionName = field?.target;
      }
      const isDetails = name === 'details' || componentName === 'ReadPrettyFormItem';
      const children: SchemaInitializerItemType[] = data?.data
        ?.filter(
          (d) =>
            (d.componentType === componentName ||
              name === d['menuName'] ||
              (isDetails && d['menuName'] === 'details')) &&
            d.collection === collectionName &&
            d.dataSource === dataSourceName,
        )
        .map((m) => {
          return {
            type: 'item',
            name: m.key,
            item: m,
            title: m.title,
            schemaInsertor: (insert, { item, fromOthersInPopup, name }) => {
              const options = { dataSourceName };
              if (association && (name === 'editForm' || name === 'currentRecord')) {
                options['association'] = association;
              }
              if (field) {
                options['association'] = `${collection?.name}.${field.name}`;
                options['associationType'] = field.type;
              } else {
                options['collectionName'] = collectionName;
              }
              options['currentRecord'] = name === 'currentRecord' && isDetails;
              if (name === 'editForm') {
                options['currentRecord'] = true;
              }
              return handleTemplateClick(item, options, insert);
            },
          } as SchemaInitializerItemType;
        });

      if (!children?.length) {
        return null;
      }
      return children;
    };
    registerInitializerMenusGenerator('block_template', generator);
  }, [data?.data, plugin.isInBlockTemplateConfigPage, handleTemplateClick, t, plugin]);

  return (
    <BlockTemplateMenusContext.Provider
      value={{
        loading,
        templates: data?.data || [],
        handleTemplateClick,
      }}
    >
      {children}
    </BlockTemplateMenusContext.Provider>
  );
};

BlockTemplateMenusProvider.displayName = 'BlockTemplateMenusProvider';
