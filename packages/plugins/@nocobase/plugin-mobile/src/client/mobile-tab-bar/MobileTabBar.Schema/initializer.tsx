/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemActionModalType } from '@nocobase/client';
import { useNavigate } from 'react-router-dom';
import { uid } from '@formily/shared';

import { generatePluginTranslationTemplate } from '../../locale';
import { getMobileTabBarItemSchemaFields } from '../MobileTabBar.Item';
import { useMobileTabContext } from '../../mobile-providers';

export interface GetMobileTabBarItemDataOptions {
  schemaId: string;
  url?: string;
  values: any;
}

export function getMobileTabBarItemData(options: GetMobileTabBarItemDataOptions) {
  const { schemaId, url, values } = options;
  return {
    url,
    parentId: null,
    options: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-toolbar-props': {
        draggable: false,
      },
      'x-settings': 'mobile:tab-bar:schema',
      'x-component': 'MobileTabBar.Schema',
      'x-component-props': {
        ...values,
        schemaId: schemaId,
      },
    },
  };
}

export interface GetMobileTabBarItemTabDataOptions {
  schemaId: string;
  pageUrl?: string;
  parentId: number;
  title?: string;
}

export function getMobileTabBarItemTabData(options: GetMobileTabBarItemTabDataOptions) {
  const { schemaId, pageUrl, parentId, title } = options;
  return {
    url: `${pageUrl}/tabs/${schemaId}`,
    parentId,
    options: {
      title: title || 'Unnamed',
    },
  };
}

export function getPageContentSchema(uid: string) {
  return {
    type: 'void',
    'x-uid': uid,
    'x-async': true, // 异步
    'x-component': 'Grid',
    'x-initializer': 'mobile:addBlock',
  };
}

function getPageSchema(pageSchemaId: string, firstTabSchemaId: string) {
  const pageSchema = {
    type: 'void',
    name: pageSchemaId,
    'x-uid': pageSchemaId,
    'x-component': 'MobilePage',
    'x-settings': 'mobile:page',
    'x-decorator': 'BlockItem',
    'x-toolbar-props': {
      draggable: false,
    },
    properties: {
      navigationBar: {
        type: 'void',
        'x-component': 'MobileNavigationBar',
      },
      [uid()]: {
        type: 'void',
        'x-component': 'MobileContent',
        'x-first-tab-schema-id': firstTabSchemaId,
        properties: {
          [firstTabSchemaId]: getPageContentSchema(firstTabSchemaId),
        },
      },
    },
  };

  return { schema: pageSchema };
}

export const mobileTabBarSchemaInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'schema',
  type: 'actionModal',
  useComponentProps() {
    const { resource, refresh, schemaResource } = useMobileTabContext();
    const navigate = useNavigate();
    return {
      isItem: true,
      width: '90%',
      title: generatePluginTranslationTemplate('Add page'),
      buttonText: generatePluginTranslationTemplate('Page'),
      schema: getMobileTabBarItemSchemaFields(),
      async onSubmit(values) {
        if (!values.title && !values.icon) {
          return;
        }

        const pageSchemaId = uid();
        const firstTabSchemaId = uid();
        const url = `/schema/${pageSchemaId}`;

        // 先创建 TabBar item
        const { data } = await resource.create({
          values: getMobileTabBarItemData({ url, schemaId: pageSchemaId, values }),
        });

        // 创建空页面
        await schemaResource.insertAdjacent({
          resourceIndex: 'mobile',
          position: 'beforeEnd',
          values: getPageSchema(pageSchemaId, firstTabSchemaId),
        });

        // 创建 TabBar item 的第一个 tab
        const parentId = data.data.id;
        await resource.create({
          values: getMobileTabBarItemTabData({ pageUrl: url, schemaId: firstTabSchemaId, parentId }),
        });

        // 刷新 tabs
        await refresh();

        // 再跳转到页面
        navigate(url);
      },
    };
  },
};
