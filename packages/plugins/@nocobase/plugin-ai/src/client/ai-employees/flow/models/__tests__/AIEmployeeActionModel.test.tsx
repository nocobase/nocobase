/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { AIEmployeeButtonModel } from '../AIEmployeeActionModel';

describe('AIEmployeeButtonModel', () => {
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
