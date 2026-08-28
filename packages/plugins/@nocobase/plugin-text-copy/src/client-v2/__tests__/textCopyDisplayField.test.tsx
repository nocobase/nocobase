/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DisplayTextFieldModel } from '@nocobase/client-v2';
import { registerTextCopyDisplayField } from '../textCopyDisplayField';

const displayTextModelMocks = vi.hoisted(() => ({
  registerFlow: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  DisplayTextFieldModel: class DisplayTextFieldModel {
    static registerFlow = displayTextModelMocks.registerFlow;
    props?: { displayCopyButton?: boolean };
    t = (value: unknown) => value;
    setProps = vi.fn((props: Record<string, unknown>) => {
      this.props = { ...this.props, ...props };
    });
    renderComponent(value: string) {
      return <span>{value}</span>;
    }
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  tExpr: (value: string) => value,
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Typography: {
      ...actual.Typography,
      Text: ({ copyable }: { copyable?: { text: string } }) => (
        <button type="button" aria-label="copy text">
          {copyable?.text}
        </button>
      ),
    },
  };
});

const patchFlag = Symbol.for('nocobase.plugin-text-copy.DisplayTextFieldModel.patched');
const originalRenderComponent = DisplayTextFieldModel.prototype.renderComponent;

describe('registerTextCopyDisplayField', () => {
  beforeEach(() => {
    delete (DisplayTextFieldModel.prototype as Record<symbol, unknown>)[patchFlag];
    DisplayTextFieldModel.prototype.renderComponent = originalRenderComponent;
    displayTextModelMocks.registerFlow.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('registers display copy switch settings', () => {
    registerTextCopyDisplayField();

    const flow = displayTextModelMocks.registerFlow.mock.calls[0][0];
    expect(flow).toMatchObject({
      key: 'textCopySettings',
      title: 'Display Field settings',
      sort: 210,
    });
    expect(flow.steps.displayCopyButton).toMatchObject({
      title: 'Display copy button',
      uiMode: { type: 'switch', key: 'displayCopyButton' },
      defaultParams: {
        displayCopyButton: false,
      },
    });

    const model = new DisplayTextFieldModel();
    flow.steps.displayCopyButton.handler({ model }, { displayCopyButton: true });
    expect(model.setProps).toHaveBeenCalledWith({ displayCopyButton: true });
  });

  it('wraps rendered text with a hover-only copy button when enabled', () => {
    registerTextCopyDisplayField();
    const model = new DisplayTextFieldModel();
    model.props = {
      displayCopyButton: true,
    };

    render(<>{model.renderComponent('hello')}</>);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.queryByLabelText('copy text')).not.toBeInTheDocument();

    const wrapper = screen.getByText('hello').closest('span');
    expect(wrapper).toBeInTheDocument();
    fireEvent.mouseEnter(wrapper as HTMLElement);

    expect(screen.getByLabelText('copy text')).toHaveTextContent('hello');
  });

  it('keeps the original rendering when copy is disabled or the copied value is empty', () => {
    registerTextCopyDisplayField();
    const model = new DisplayTextFieldModel();

    model.props = {
      displayCopyButton: false,
    };
    const disabledContent = model.renderComponent('hello');
    expect(disabledContent).toEqual(<span>hello</span>);

    model.props = {
      displayCopyButton: true,
    };
    model.t = () => '';
    const emptyContent = model.renderComponent('hello');
    expect(emptyContent).toEqual(<span>hello</span>);
  });

  it('does not patch DisplayTextFieldModel more than once', () => {
    registerTextCopyDisplayField();
    const patchedRenderComponent = DisplayTextFieldModel.prototype.renderComponent;

    registerTextCopyDisplayField();

    expect(DisplayTextFieldModel.prototype.renderComponent).toBe(patchedRenderComponent);
    expect(displayTextModelMocks.registerFlow).toHaveBeenCalledTimes(2);
  });
});
