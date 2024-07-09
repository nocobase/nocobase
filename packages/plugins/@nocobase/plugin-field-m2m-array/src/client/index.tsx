/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { MBMFieldInterface } from './mbm';
import { ForeignKey } from './ForeignKey';
import { TargetKey } from './TargetKey';

export class PluginM2MArrayClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addComponents({
      MBMForeignKey: ForeignKey,
      MBMTargetKey: TargetKey,
    });
    this.app.dataSourceManager.addFieldInterfaces([MBMFieldInterface]);
  }
}

export default PluginM2MArrayClient;
