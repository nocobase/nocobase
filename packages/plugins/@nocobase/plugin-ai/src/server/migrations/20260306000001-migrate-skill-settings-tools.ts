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
  on = 'afterSync';
  appVersion = '<2.1.0';

  async up() {
    const repo = this.db.getRepository('aiEmployees');
    const rows = await repo.find({});
    let updated = 0;

    for (const row of rows) {
      const skillSettings = row.get?.('skillSettings') ?? row.skillSettings;
      if (!skillSettings || typeof skillSettings !== 'object') {
        continue;
      }
      if (Array.isArray(skillSettings.tools) && skillSettings.tools.length > 0) {
        continue;
      }
      const skills = skillSettings.skills;
      let nextTools: any[] | null = null;
      if (Array.isArray(skills)) {
        const hasObject = skills.some((item) => item && typeof item === 'object');
        if (hasObject) {
          nextTools = skills;
        }
      }

      const nextSkillSettings = { ...skillSettings, tools: nextTools ?? [] };
      if (Array.isArray(skills)) {
        delete nextSkillSettings.skills;
      }
      await row.update({ skillSettings: nextSkillSettings });
      updated += 1;
    }

    if (updated > 0) {
      this.app.logger.info(`Migrated aiEmployees.skillSettings.skills -> skillSettings.tools (${updated})`);
    }
  }
}
