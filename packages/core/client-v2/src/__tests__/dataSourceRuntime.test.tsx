/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { describe, expect, it } from 'vitest';

class InputInterface {
  name = 'input';
  group = 'basic';
  titleUsable = true;
}

describe('data source runtime', () => {
  it('shares one dataSourceManager instance between app and flow context', () => {
    const app = createMockClient();

    expect(app.dataSourceManager).toBe(app.flowEngine.context.dataSourceManager);
    expect(app.dataSourceManager.collectionFieldInterfaceManager).toBeTruthy();
  });

  it('supports registering field interfaces through app api', () => {
    const app = createMockClient();

    app.addFieldInterfaces([InputInterface as any]);

    expect(app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface('input')?.titleUsable).toBe(true);
  });
});
