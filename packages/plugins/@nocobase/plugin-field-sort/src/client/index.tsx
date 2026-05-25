/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { SortFieldInterface } from './sort-interface';
import { SortFieldModel } from '../client-v2/models/SortFieldModel';

export class PluginFieldSortClient extends Plugin {
  async load() {
    this.app.addFieldInterfaces([SortFieldInterface]);
    this.flowEngine.registerModels({ SortFieldModel });
  }
}

export default PluginFieldSortClient;
