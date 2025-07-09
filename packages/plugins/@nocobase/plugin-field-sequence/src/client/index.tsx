/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { SequenceFieldProvider } from './SequenceFieldProvider';
import { SequenceFieldInterface } from './sequence';
import { SequenceFieldModel } from './SequenceFieldModel';

export class PluginFieldSequenceClient extends Plugin {
  async load() {
    this.app.use(SequenceFieldProvider);
    this.app.dataSourceManager.addFieldInterfaces([SequenceFieldInterface]);
    const calendarPlugin: any = this.app.pm.get('calendar');
    // 注册标题字段
    calendarPlugin.registerTitleFieldInterface('sequence');
    this.flowEngine.registerModels({
      SequenceFieldModel,
    });
  }
}

export default PluginFieldSequenceClient;
