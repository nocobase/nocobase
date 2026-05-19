/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import * as _ from 'lodash';

const parseOptions = (value: any) => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  }
  return value;
};

const isRouteModelOptions = (value: any) => {
  const options = parseOptions(value);
  return options?.use === 'RouteModel' || options?.schema?.use === 'RouteModel';
};

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    if (
      !this.db.hasCollection('desktopRoutes') ||
      !this.db.hasCollection('flowModels') ||
      !this.db.hasCollection('flowModelTreePath')
    ) {
      return;
    }

    await this.db.sequelize.transaction(async (transaction) => {
      const desktopRoutesRepo = this.db.getRepository('desktopRoutes');
      const flowRepo = this.db.getRepository('flowModels') as any;
      const treePathRepo = this.db.getRepository('flowModelTreePath');

      const desktopRoutes = await desktopRoutesRepo.find({ fields: ['schemaUid'], transaction });
      const routeSchemaUids = new Set(desktopRoutes.map((route) => route.get('schemaUid')).filter(Boolean));

      const flowModels = await flowRepo.find({ fields: ['uid', 'options'], transaction });
      const routeModelUids = flowModels
        .filter((model) => isRouteModelOptions(model.get('options')))
        .map((model) => model.get('uid'))
        .filter(Boolean);

      if (routeModelUids.length) {
        const childRouteModels = new Set<string>();
        for (const chunk of _.chunk(routeModelUids, 500)) {
          const parentPaths = await treePathRepo.find({
            filter: {
              descendant: {
                $in: chunk,
              },
              depth: 1,
            },
            fields: ['descendant'],
            transaction,
          });
          for (const path of parentPaths) {
            const descendant = path.get('descendant');
            if (descendant) {
              childRouteModels.add(descendant);
            }
          }
        }
        const orphanRouteModelUids = routeModelUids.filter(
          (uid) => !routeSchemaUids.has(uid) && !childRouteModels.has(uid),
        );

        for (const uid of orphanRouteModelUids) {
          await flowRepo.remove(uid, { transaction });
        }
      }

      if (this.db.hasCollection('flowModelTemplateUsages')) {
        const usageRepo = this.db.getRepository('flowModelTemplateUsages');
        const usages = await usageRepo.find({ fields: ['modelUid'], transaction });
        const usageModelUids = _.uniq(usages.map((usage) => usage.get('modelUid')).filter(Boolean));

        for (const chunk of _.chunk(usageModelUids, 500)) {
          const existingModels = await flowRepo.find({
            fields: ['uid'],
            filter: {
              uid: {
                $in: chunk,
              },
            },
            transaction,
          });
          const existingUids = new Set(existingModels.map((model) => model.get('uid')).filter(Boolean));
          const missingUids = chunk.filter((uid) => !existingUids.has(uid));

          if (missingUids.length) {
            await usageRepo.destroy({
              filter: {
                modelUid: {
                  $in: missingUids,
                },
              },
              transaction,
            });
          }
        }
      }
    });
  }
}
