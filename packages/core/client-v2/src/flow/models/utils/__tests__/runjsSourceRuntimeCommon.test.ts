/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createRuntimeRunTracker,
  getLightExtensionSettingDefaultValue,
  normalizeLightExtensionRuntimeError,
  stableSerialize,
} from '../runjsSourceRuntimeCommon';

describe('runjsSourceRuntimeCommon', () => {
  it('tracks the latest run per model independently', () => {
    const tracker = createRuntimeRunTracker();
    const firstModel = {};
    const secondModel = {};

    const firstRun = tracker.begin(firstModel);
    const secondRun = tracker.begin(firstModel);

    expect(tracker.isCurrent(firstModel, firstRun)).toBe(false);
    expect(tracker.isCurrent(firstModel, secondRun)).toBe(true);
    expect(tracker.isCurrent(secondModel, secondRun)).toBe(false);
  });

  it('prefers saved settings, descriptor defaults, then schema defaults', () => {
    const schema = { default: 'schema' };

    expect(getLightExtensionSettingDefaultValue('value', schema, { value: 'descriptor' }, { value: 'saved' })).toBe(
      'saved',
    );
    expect(getLightExtensionSettingDefaultValue('value', schema, { value: 'descriptor' }, {})).toBe('descriptor');
    expect(getLightExtensionSettingDefaultValue('value', schema, {}, {})).toBe('schema');
  });

  it('normalizes server error envelopes without changing surface-specific hints', () => {
    const result = normalizeLightExtensionRuntimeError(
      {
        response: {
          status: 409,
          data: {
            errors: [{ code: 'binding_outdated', message: 'Refresh required' }],
          },
        },
      },
      {
        defaultTitle: 'Runtime error',
        defaultHint: 'Retry',
        defaultMessage: 'Failed',
        outdatedHint: 'Refresh this surface',
        invalidSettingsHint: 'Fix settings',
      },
    );

    expect(result).toEqual({
      title: 'Light extension binding is outdated',
      hint: 'Refresh this surface',
      message: 'Refresh required',
      code: 'binding_outdated',
      status: 409,
    });
  });

  it('serializes records with stable key ordering', () => {
    expect(stableSerialize({ second: 2, first: { beta: 2, alpha: 1 } })).toBe(
      '{"first":{"alpha":1,"beta":2},"second":2}',
    );
  });
});
