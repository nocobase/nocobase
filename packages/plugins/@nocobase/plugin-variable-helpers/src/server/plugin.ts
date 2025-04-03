/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { helperGroups, helpers } from '../json-template-helpers';
export class PluginVariableFiltersServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    helperGroups.forEach((group) => {
      this.app.jsonTemplateParser.registerHelperGroup(group);
    });

    helpers.forEach((filter) => {
      this.app.jsonTemplateParser.registerHelper(filter);
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginVariableFiltersServer;
