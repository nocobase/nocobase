/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

export default class PluginNotificationsServer extends Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
}
