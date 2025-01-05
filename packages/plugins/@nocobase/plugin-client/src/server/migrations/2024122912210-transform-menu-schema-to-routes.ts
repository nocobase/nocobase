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
  appVersion = '<=1.6.0-alpha.9';
  async up() {
    const uiSchemas: any = this.db.getRepository('uiSchemas');
    const desktopRoutes: any = this.db.getRepository('desktopRoutes');
    const rolesRepository = this.db.getRepository('roles');
    const menuSchema = await uiSchemas.getJsonSchema('nocobase-admin-menu');
    const routes = await schemaToRoutes(menuSchema, uiSchemas);

    if (routes.length === 0) {
      return;
    }

    try {
      await this.db.sequelize.transaction(async (transaction) => {
        // 1. 将旧版菜单数据转换为新版菜单数据
        await desktopRoutes.createMany({
          records: routes,
          transaction,
        });

        // 2. 将旧版的权限配置，转换为新版的权限配置

        const roles = await rolesRepository.find({
          appends: ['desktopRoutes', 'menuUiSchemas'],
          transaction,
        });

        for (const role of roles) {
          const menuUiSchemas = role.menuUiSchemas || [];
          const desktopRoutes = role.desktopRoutes || [];
          const needRemoveIds = getNeedRemoveIds(desktopRoutes, menuUiSchemas);

          if (needRemoveIds.length === 0) {
            return;
          }

          // @ts-ignore
          await this.db.getRepository('roles.desktopRoutes', role.name).remove({
            tk: needRemoveIds,
            transaction,
          });
        }
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
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
    if (item['x-component'] === 'Menu.URL') {
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

function getNeedRemoveIds(desktopRoutes: any[], menuUiSchemas: any[]) {
  const uidList = menuUiSchemas.map((item) => item['x-uid']);
  return desktopRoutes
    .filter((item) => {
      // 之前是不支持配置 tab 的权限的，所以所有的 tab 都不会存在于旧版的 menuUiSchemas 中
      if (item.type === 'tabs') {
        // tab 的父节点就是一个 page
        const page = desktopRoutes.find((route) => route.id === item.parentId);
        // tab 要不要过滤掉，和它的父节点（page）有关
        return !uidList.includes(page.schemaUid);
      }

      return !uidList.includes(item.schemaUid);
    })
    .map((item) => item.id);
}
