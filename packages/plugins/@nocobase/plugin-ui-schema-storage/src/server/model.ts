/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MagicAttributeModel } from '@nocobase/database';
import { HookType } from './server-hooks';

class UiSchemaModel extends MagicAttributeModel {
  getServerHooksByType(type: HookType) {
    const hooks = this.get('x-server-hooks') || [];
    return hooks.filter((hook) => hook.type === type);
  }
}

export { UiSchemaModel };
