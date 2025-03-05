/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { variableFilters, filterGroups } from '../json-template-filters';
export class PluginVariableFiltersServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    filterGroups.forEach((group) => {
      this.app.jsonTemplateParser.registerFilterGroup(group);
    });

    variableFilters.forEach((filter) => {
      this.app.jsonTemplateParser.registerFilter(filter);
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginVariableFiltersServer;
