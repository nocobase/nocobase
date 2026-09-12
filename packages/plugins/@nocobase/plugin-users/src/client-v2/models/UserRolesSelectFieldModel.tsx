/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecordSelectFieldModel } from '@nocobase/client-v2';

const ROOT_ROLE_FILTER_GROUP_KEY = '__plugin_users__exclude_root_role__';

export class UserRolesSelectFieldModel extends RecordSelectFieldModel {
  private ensureResourceRequestDefaults() {
    if (!this.resource) {
      return;
    }
    this.resource.addRequestParameter('showAnonymous', true);
    this.resource.addFilterGroup(ROOT_ROLE_FILTER_GROUP_KEY, {
      'name.$ne': 'root',
    });
  }

  render() {
    this.ensureResourceRequestDefaults();
    return super.render();
  }
}
