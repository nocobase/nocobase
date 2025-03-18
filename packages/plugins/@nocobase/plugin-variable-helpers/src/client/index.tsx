/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { filterGroups, variableFilters } from '../json-template-filters';
export class PluginVariableFiltersClient extends Plugin {
  async afterAdd() {
    filterGroups.forEach((group) => {
      this.app.jsonTemplateParser.registerFilterGroup(group);
    });

    variableFilters.forEach((filter) => {
      this.app.jsonTemplateParser.registerFilter(filter);
    });
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginVariableFiltersClient;
