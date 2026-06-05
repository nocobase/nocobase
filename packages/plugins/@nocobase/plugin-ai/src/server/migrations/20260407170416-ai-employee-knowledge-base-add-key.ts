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
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<2.2.0';

  async up() {
    const aiEmployeesRepo = this.app.db.getRepository('aiEmployees');
    const aiEmployeeList = await aiEmployeesRepo.find();
    for (const item of aiEmployeeList) {
      if (!item.knowledgeBase?.knowledgeBaseIds?.length) {
        continue;
      }
      if (item.knowledgeBase?.knowledgeBaseKeys?.length) {
        continue;
      }
      await aiEmployeesRepo.update({
        values: {
          knowledgeBase: {
            ...item.knowledgeBase,
            knowledgeBaseKeys: item.knowledgeBase.knowledgeBaseIds.map((it) => String(it)),
          },
        },
        filter: {
          username: item.username,
        },
      });
    }
  }
}
