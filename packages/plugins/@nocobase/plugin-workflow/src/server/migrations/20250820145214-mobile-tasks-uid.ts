/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.9.0';
  async up() {
    const { db, app } = this.context;
    const MobileRouteRepo = db.getRepository('mobileRoutes');
    const route = await MobileRouteRepo.findOne({
      filter: {
        type: 'page',
        schemaUid: 'workflow/tasks',
      },
    });
    if (!route) {
      app.logger.debug(`no route found to be migrated.`);
      return;
    }
    await route.update({
      schemaUid: 'workflow-tasks',
      options: {
        url: '/page/workflow-tasks',
        schema: {
          'x-component': 'MobileTabBarWorkflowTasksItem',
        },
      },
    });
  }
}
