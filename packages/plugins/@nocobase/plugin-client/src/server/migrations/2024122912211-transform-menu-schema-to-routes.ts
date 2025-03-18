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
  appVersion = '<1.6.0';
  async up() {
    const uiSchemas: any = this.db.getRepository('uiSchemas');
    const desktopRoutes = this.db.getRepository('desktopRoutes');
    const count = await desktopRoutes.count();
    if (count > 0) {
      return;
    }
    const mobileRoutes: any = this.db.getRepository('mobileRoutes');
    const rolesRepository = this.db.getRepository('roles');
    const menuSchema = await uiSchemas.getJsonSchema('nocobase-admin-menu');
    const routes = await schemaToRoutes(menuSchema, uiSchemas);

    try {
      await this.db.sequelize.transaction(async (transaction) => {
        if (routes.length > 0) {
          // 1. 将旧版菜单数据转换为新版菜单数据
          await desktopRoutes.createMany({
            records: routes,
            transaction,
          });

          // 2. 将旧版的权限配置，转换为新版的权限配置

          const roles = await rolesRepository.find({
            appends: ['menuUiSchemas'],
            transaction,
          });
          const allDesktopRoutes = await desktopRoutes.find({ transaction });

          for (const role of roles) {
            const menuUiSchemas = role.menuUiSchemas || [];
            const { needRemoveIds, needAddIds } = getIds(allDesktopRoutes, menuUiSchemas);

            if (needRemoveIds.length > 0) {
              // @ts-ignore
              await this.db.getRepository('roles.desktopRoutes', role.name).remove({
                tk: needRemoveIds,
                transaction,
              });
            }

            if (needAddIds.length > 0) {
              // @ts-ignore
              await this.db.getRepository('roles.desktopRoutes', role.name).add({
                tk: needAddIds,
                transaction,
              });
            }
          }
        }

        if (mobileRoutes) {
          // 3. 将旧版的移动端菜单数据转换为新版的移动端菜单数据
          const allMobileRoutes = await mobileRoutes.find({
            transaction,
          });

          for (const item of allMobileRoutes || []) {
            if (item.type !== 'page') {
              continue;
            }

            const mobileRouteSchema = await uiSchemas.getJsonSchema(item.schemaUid);
            const enableTabs = !!mobileRouteSchema?.['x-component-props']?.displayTabs;

            await mobileRoutes.update({
              filterByTk: item.id,
              values: {
                enableTabs,
              },
              transaction,
            });

            await mobileRoutes.update({
              filter: {
                parentId: item.id,
              },
              values: {
                hidden: !enableTabs,
              },
              transaction,
            });
          }
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
      const enableTabs = pageSchema?.['x-component-props']?.enablePageTabs;
      const enableHeader = !pageSchema?.['x-component-props']?.disablePageHeader;
      const displayTitle = !pageSchema?.['x-component-props']?.hidePageTitle;

      return {
        type: 'page',
        title: item.title,
        icon: item['x-component-props']?.icon,
        schemaUid: pageSchema?.['x-uid'],
        menuSchemaUid: item['x-uid'],
        hideInMenu: false,
        enableTabs,
        enableHeader,
        displayTitle,
        children: (await schemaToRoutes(pageSchema, uiSchemas)).map((item) => ({ ...item, hidden: !enableTabs })),
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
      title: item.title,
      icon: item['x-component-props']?.icon,
      schemaUid: item['x-uid'],
      tabSchemaName: key,
      hideInMenu: false,
    };
  });

  return Promise.all(result);
}

export function getIds(desktopRoutes: any[], menuUiSchemas: any[]) {
  const uidList = menuUiSchemas.map((item) => item['x-uid']);
  const needRemoveIds = desktopRoutes
    .filter((item) => {
      // 之前是不支持配置 tab 的权限的，所以所有的 tab 都不会存在于旧版的 menuUiSchemas 中
      if (item.type === 'tabs') {
        // tab 的父节点就是一个 page
        const page = desktopRoutes.find((route) => route?.id === item?.parentId);
        // tab 要不要过滤掉，和它的父节点（page）有关
        return !uidList.includes(page?.menuSchemaUid);
      }

      if (item.type === 'page') {
        return !uidList.includes(item?.menuSchemaUid);
      }

      return !uidList.includes(item?.schemaUid);
    })
    .map((item) => item?.id);
  const needAddIds = desktopRoutes.map((item) => item?.id).filter((id) => !needRemoveIds.includes(id));

  return { needRemoveIds, needAddIds };
}
