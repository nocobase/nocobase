/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, createMockClient } from '@nocobase/client-v2';
import { describe, expect, it } from 'vitest';

class InputInterface {
  name = 'input';
  group = 'basic';
  titleUsable = true;
}

class OperatorOnlyInterface extends CollectionFieldInterface {
  name = 'operatorOnly';
  group = 'basic';
  filterable = {};
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

  it('exposes operators registered on interfaces without predefined operator lists', () => {
    const app = createMockClient();
    const operator = {
      label: 'plugin operator',
      value: '$plugin',
      schema: { 'x-component': 'PluginInput' },
    };

    app.addFieldInterfaces([OperatorOnlyInterface as any]);
    app.addFieldInterfaceOperator('operatorOnly', operator);

    const fieldInterface = app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface('operatorOnly');
    expect(fieldInterface?.filterable?.operators).toEqual([operator]);
  });
});
