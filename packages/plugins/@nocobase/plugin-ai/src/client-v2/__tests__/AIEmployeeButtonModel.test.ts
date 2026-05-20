/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { ErrorFlowModel, FlowEngine } from '@nocobase/flow-engine';
import PluginAIClientV2, { AIEmployeeButtonModel } from '../index';

describe('PluginAIClientV2 AIEmployeeButtonModel', () => {
  test('registers AIEmployeeButtonModel for persisted flow surfaces', async () => {
    const app = createMockClient();

    await app.pm.add(PluginAIClientV2);
    await app.load();

    const model = app.flowEngine.createModel({
      uid: 'ai-employee-button',
      use: 'AIEmployeeButtonModel',
      props: {
        aiEmployee: {
          username: 'dex',
        },
      },
    });

    expect(model).toBeInstanceOf(AIEmployeeButtonModel);
    expect(model).not.toBeInstanceOf(ErrorFlowModel);
  });

  test('preserves authored avatar style over defaults', () => {
    const flowEngine = new FlowEngine();

    const authored = new AIEmployeeButtonModel({
      flowEngine,
      uid: 'ai-employee-button-authored',
      props: {
        style: {
          size: 36,
          mask: true,
        },
      },
    });
    const defaulted = new AIEmployeeButtonModel({
      flowEngine,
      uid: 'ai-employee-button-defaulted',
      props: {},
    });

    expect(authored.props.style).toEqual({ size: 36, mask: true });
    expect(defaulted.props.style).toEqual({ size: 40, mask: false });
  });
});
