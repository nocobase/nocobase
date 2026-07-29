/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { settingsNeutral } from '../builtinThemes';

/**
 * 给已有实例补一条设置中心主题。
 *
 * 设置中心的外观改由这条记录约束（见 `builtinThemes.settingsNeutral`），
 * 新装实例在 install 时写入，老实例走这里补。
 */
export default class extends Migration {
  appVersion = '<2.2.0-alpha.12';

  async up() {
    const repository = this.db.getRepository('themeConfig');
    if (!repository) {
      return;
    }

    const existed = await repository.findOne({ filter: { uid: settingsNeutral.uid } });
    if (existed) {
      return;
    }

    await repository.create({ values: settingsNeutral });
  }
}
