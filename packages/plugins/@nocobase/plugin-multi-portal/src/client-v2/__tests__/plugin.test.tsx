/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginMultiPortalClientV2 from '../plugin';

describe('PluginMultiPortalClientV2', () => {
  it('should load as an isolated client-v2 plugin', async () => {
    const app = createMockClient({
      plugins: [PluginMultiPortalClientV2],
    });

    await app.load();

    expect(app.pm.get(PluginMultiPortalClientV2)).toBeInstanceOf(PluginMultiPortalClientV2);
  });
});
