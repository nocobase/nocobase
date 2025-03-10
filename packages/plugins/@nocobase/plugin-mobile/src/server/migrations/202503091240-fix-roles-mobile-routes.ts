/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import _ from 'lodash';

export default class extends Migration {
  appVersion = '<1.6.0';
  async up() {
    const rolesMobileRoutesRepo = this.db.getRepository('rolesMobileRoutes');
    const count = await rolesMobileRoutesRepo.count();
    if (!count) {
      return;
    }
    const mobileRoutesRepo = this.db.getRepository('mobileRoutes');

    try {
      await this.db.sequelize.transaction(async (transaction) => {
        const rolesMobileRoutes = await rolesMobileRoutesRepo.find({ transaction });
        const rolesMobileRouteIds = rolesMobileRoutes.map((x) => x.get('mobileRouteId'));
        const mobileRoutes = await mobileRoutesRepo.find({
          filter: { $or: [{ id: rolesMobileRouteIds }, { parentId: rolesMobileRouteIds }] },
          transaction,
        });
        const records = findMissingRoutes(rolesMobileRoutes, mobileRoutes);
        await rolesMobileRoutesRepo.createMany({ records, transaction });
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

function findMissingRoutes(rolesMobileRoutes, mobileRoutes) {
  const routeMap = _.keyBy(mobileRoutes, 'id');
  const group = (id, roleName) => `${id}_${roleName}`;
  const existingMap = new Set(rolesMobileRoutes.map((x) => group(x.mobileRouteId, x.roleName)));

  const missingRoutes = [];
  rolesMobileRoutes.forEach((route) => {
    const parentRoute = routeMap[route.mobileRouteId];

    mobileRoutes.forEach((child) => {
      if (child.hidden && child.parentId === parentRoute.id) {
        const key = group(child.id, route.roleName);
        if (!existingMap.has(key)) {
          missingRoutes.push({ mobileRouteId: child.id, roleName: route.roleName });
        }
      }
    });
  });

  return missingRoutes;
}
