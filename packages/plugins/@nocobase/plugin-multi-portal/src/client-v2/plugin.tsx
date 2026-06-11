/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { registerMultiPortalsFromApi } from './layoutRegistration';

export class PluginMultiPortalClientV2 extends Plugin {
  async load() {
    await registerMultiPortalsFromApi(this.app);
  }
}

export default PluginMultiPortalClientV2;
