/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { SequenceFieldInterface } from './interface';
import { DisplayItemModel, EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';

export class PluginFieldSequenceClient extends Plugin<any, Application> {
  async load() {
    this.app.addFieldInterfaces([SequenceFieldInterface]);

    const calendarPlugin: any = this.app.pm.get('calendar');
    calendarPlugin?.registerTitleFieldInterface?.('sequence');

    EditableItemModel.bindModelToInterface('InputFieldModel', ['sequence'], { isDefault: true });
    DisplayItemModel.bindModelToInterface('DisplayTextFieldModel', ['sequence'], { isDefault: true });
    FilterableItemModel.bindModelToInterface('InputFieldModel', ['sequence'], { isDefault: true });
  }
}

export default PluginFieldSequenceClient;
