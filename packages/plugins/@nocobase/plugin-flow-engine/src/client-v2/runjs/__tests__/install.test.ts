/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { installRunJSRuntimeClientV2, type RunJSRuntimeHostRegistration } from '../install';

describe('installRunJSRuntimeClientV2', () => {
  it('rolls back a partially installed host stack in reverse order when installation fails', () => {
    const order: string[] = [];
    const error = new Error('runtime registration failed');
    const registration: RunJSRuntimeHostRegistration = {
      registerRegistryHost: vi.fn(() => () => order.push('registry')),
      registerRuntimeHost: vi.fn(() => {
        throw error;
      }),
    };

    expect(() => installRunJSRuntimeClientV2(registration)).toThrow(error);
    expect(order).toEqual(['registry']);
  });

  it('disposes runtime then registry exactly once', () => {
    const order: string[] = [];
    const registration: RunJSRuntimeHostRegistration = {
      registerRegistryHost: vi.fn(() => () => order.push('registry')),
      registerRuntimeHost: vi.fn(() => () => order.push('runtime')),
    };

    const dispose = installRunJSRuntimeClientV2(registration);
    dispose();
    dispose();

    expect(order).toEqual(['runtime', 'registry']);
  });
});
