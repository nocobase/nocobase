/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<=1.5.0-beta.18';
  async up() {
    const uiSchemas: any = this.db.getRepository('uiSchemas');
    const desktopRoutes: any = this.db.getRepository('desktopRoutes');
    await this.db.sequelize.transaction(async (transaction) => {
      const menuSchema = await uiSchemas.getJsonSchema('nocobase-admin-menu');

      const routes = await schemaToRoutes(menuSchema, uiSchemas);

      if (routes.length === 0) {
        return;
      }

      await desktopRoutes.createMany({
        records: routes,
      });
    });
  }
}

export async function schemaToRoutes(schema: any, uiSchemas: any) {
  const schemaKeys = Object.keys(schema.properties || {});

  if (schemaKeys.length === 0) {
    return [];
  }

  const result = schemaKeys.map(async (key: string) => {
    const item = schema.properties[key];

    // Group
    if (item['x-component'] === 'Menu.SubMenu') {
      return {
        type: 'group',
        title: item.title,
        icon: item['x-component-props']?.icon,
        schemaUid: item['x-uid'],
        hideInMenu: false,
        children: await schemaToRoutes(item, uiSchemas),
      };
    }

    // Page
    if (item['x-component'] === 'Menu.Item') {
      const menuSchema = await uiSchemas.getProperties(item['x-uid']);
      const pageSchema = menuSchema?.properties?.page;
      return {
        type: 'page',
        title: item.title,
        icon: item['x-component-props']?.icon,
        schemaUid: item['x-uid'],
        pageSchemaUid: pageSchema?.['x-uid'],
        hideInMenu: false,
        children: await schemaToRoutes(pageSchema, uiSchemas),
      };
    }

    // Link
    if (item['x-component'] === 'Menu.Link') {
      return {
        type: 'link',
        title: item.title,
        icon: item['x-component-props']?.icon,
        options: {
          href: item['x-component-props']?.href,
          params: item['x-component-props']?.params,
        },
        schemaUid: item['x-uid'],
        hideInMenu: false,
      };
    }

    // Tab
    return {
      type: 'tabs',
      title: item.title || '{{t("Tab")}}',
      icon: item['x-component-props']?.icon,
      schemaUid: item['x-uid'],
      tabSchemaName: key,
      hideInMenu: false,
    };
  });

  return Promise.all(result);
}
