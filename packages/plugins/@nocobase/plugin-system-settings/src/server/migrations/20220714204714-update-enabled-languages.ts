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
  appVersion = '<0.7.3-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<=0.7.2-alpha.7');
    if (!result) {
      return;
    }
    const SystemSetting = this.context.db.getRepository('systemSettings');
    const setting = await SystemSetting.findOne();
    const enabledLanguages = setting.get('enabledLanguages') || [];
    if (Array.isArray(enabledLanguages) && enabledLanguages.length === 0) {
      setting.set('enabledLanguages', [setting.get('appLang') || 'en-US']);
      await setting.save();
    }
  }
}
