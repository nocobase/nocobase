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
    const desktopRoutes = this.db.getRepository('desktopRoutes');
    const count = await desktopRoutes.count();
    if (!count) {
      return;
    }
    const rolesRepository = this.db.getRepository('roles');

    try {
      await this.db.sequelize.transaction(async (transaction) => {
        const roles = await rolesRepository.find({
          appends: ['menuUiSchemas'],
          transaction,
        });
        const allDesktopRoutes = await desktopRoutes.find({ transaction });

        for (const role of roles) {
          const menuUiSchemas = role.menuUiSchemas || [];
          const { needAddIds } = getIds(allDesktopRoutes, menuUiSchemas);

          if (needAddIds.length > 0) {
            // @ts-ignore
            await this.db.getRepository('roles.desktopRoutes', role.name).add({
              tk: needAddIds,
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
