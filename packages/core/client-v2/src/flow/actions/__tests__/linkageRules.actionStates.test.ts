/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getActionLinkageStateOptions } from '../linkageRules';

describe('getActionLinkageStateOptions', () => {
  const t = (key: string) => key;

  it('returns all states for regular action models', () => {
    expect(getActionLinkageStateOptions({}, t).map((option) => option.value)).toEqual([
      'visible',
      'hidden',
      'hiddenText',
      'enabled',
      'disabled',
    ]);
  });

  it('filters states declared unsupported by the action model', () => {
    expect(
      getActionLinkageStateOptions({ supportedActionLinkageStates: ['visible', 'hidden'] }, t).map(
        (option) => option.value,
      ),
    ).toEqual(['visible', 'hidden']);
  });
});
