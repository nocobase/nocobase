/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { AIEmployeeButtonModel } from '../models/ai-employees';

describe('AIEmployeeButtonModel', () => {
  it('supports action linkage rules', () => {
    const buttonSettings = AIEmployeeButtonModel.globalFlowRegistry.getFlow('buttonSettings');

    expect(buttonSettings?.steps?.linkageRules?.use).toBe('actionLinkageRules');
    expect(AIEmployeeButtonModel.prototype.supportedActionLinkageStates).toEqual(['visible', 'hidden']);
  });

  it('renders the AI employee button as disabled-looking content when hidden in config mode', () => {
    const model = Object.create(AIEmployeeButtonModel.prototype) as AIEmployeeButtonModel;
    model.props = {
      aiEmployee: { username: 'atlas' },
      context: { workContext: [] },
      style: {},
    };

    const preview = (
      model as unknown as {
        renderHiddenInConfig(): React.ReactNode;
      }
    ).renderHiddenInConfig();

    expect(React.isValidElement<{ style?: React.CSSProperties; children?: React.ReactNode }>(preview)).toBe(true);
    if (!React.isValidElement<{ style?: React.CSSProperties; children?: React.ReactNode }>(preview)) {
      throw new Error('Expected hidden AI employee preview to be a React element');
    }
    expect(preview.props.style).toMatchObject({ display: 'inline-flex', opacity: 0.3 });
    expect(React.isValidElement(preview.props.children)).toBe(true);
  });
});
