/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, type InstallOptions } from '@nocobase/server';

export class PluginGanttServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {}

  async install(options?: InstallOptions) {
    void options;
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginGanttServer;
