/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { validateActionLinkageRulesAgainstCapability } from '../flow-surfaces/reaction/linkage';
import { getActionLinkageStatesForUse, getReactionKindsForUse } from '../flow-surfaces/reaction/registry';
import type { FlowSurfaceActionLinkageRule } from '../flow-surfaces/reaction/types';

describe('flowSurfaces AI employee action', () => {
  it('exposes action linkage capability', () => {
    expect(getReactionKindsForUse('AIEmployeeButtonModel')).toEqual(['actionLinkage']);
    expect(getActionLinkageStatesForUse('AIEmployeeButtonModel')).toEqual(['visible', 'hidden']);
  });

  it('rejects action states that the AI employee target does not support', () => {
    const rules: FlowSurfaceActionLinkageRule[] = [
      {
        key: 'disable-ai-employee',
        title: 'Disable AI employee',
        enabled: true,
        when: { logic: '$and', items: [] },
        then: [{ type: 'setActionState', state: 'disabled' }],
      },
    ];

    expect(() =>
      validateActionLinkageRulesAgainstCapability(rules, {
        supportedActions: [{ type: 'setActionState', states: ['visible', 'hidden'] }],
        conditionMeta: { operatorsByPath: {} },
      }),
    ).toThrow('Action linkage state "disabled" is not supported by this target.');
  });
});
