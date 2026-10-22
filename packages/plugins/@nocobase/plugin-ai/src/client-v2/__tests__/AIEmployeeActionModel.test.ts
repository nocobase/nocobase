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
import { render } from '@testing-library/react';
import { FlowEngine } from '@nocobase/flow-engine';
import { AIEmployeeButtonModel } from '../models/ai-employees';

describe('AIEmployeeButtonModel', () => {
  it('supports action linkage rules', () => {
    const buttonSettings = AIEmployeeButtonModel.globalFlowRegistry.getFlow('buttonSettings');

    expect(buttonSettings?.steps?.linkageRules?.use).toBe('actionLinkageRules');
    expect(AIEmployeeButtonModel.prototype.supportedActionLinkageStates).toEqual(['visible', 'hidden']);
  });

  it('renders a lightweight placeholder when hidden in config mode', async () => {
    const engine = new FlowEngine();
    const model = new AIEmployeeButtonModel({
      uid: 'ai-employee-button',
      flowEngine: engine,
      props: {
        aiEmployee: { username: 'atlas' },
        context: { workContext: [] },
        auto: false,
        style: { size: 32 },
      },
    });
    await engine.flowSettings.enable();
    model.setHidden(true);

    // Assert first so a regression fails fast: the hidden preview must not render the reactive wrapper again,
    // otherwise rendering would recurse forever and freeze the page.
    const reactiveRenderType = (model.render() as React.ReactElement).type;
    const preview = (
      model as unknown as {
        renderHiddenInConfig(): React.ReactNode;
      }
    ).renderHiddenInConfig();
    const previewChildren = React.isValidElement<{ children?: React.ReactNode }>(preview)
      ? React.Children.toArray(preview.props.children)
      : [];
    expect(previewChildren.some((child) => React.isValidElement(child) && child.type === reactiveRenderType)).toBe(
      false,
    );

    const { container } = render(model.render());

    const placeholder = container.firstElementChild as HTMLElement;
    expect(placeholder?.style.opacity).toBe('0.3');
    expect(container.querySelector('.ant-avatar')).toBeTruthy();
    // The hidden preview only renders a static placeholder, never the real shortcut button that would
    // initialize the chatbox runtime and subscribe to its stores.
    expect(container.querySelector('span[style*="cursor: pointer"]')).toBeNull();
  });
});
