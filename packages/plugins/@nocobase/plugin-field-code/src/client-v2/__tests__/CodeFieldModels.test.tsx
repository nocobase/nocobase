/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeFieldModel } from '../models/CodeFieldModel';
import { DisplayCodeFieldModel } from '../models/DisplayCodeFieldModel';

type CodeEditorProps = {
  disabled?: boolean;
  height?: string;
  indentUnit?: number;
  value?: string;
};

const mocks = vi.hoisted(() => ({
  editorProps: [] as CodeEditorProps[],
}));

vi.mock('../CodeEditor', async () => {
  const ReactModule = await import('react');
  return {
    default: (props: CodeEditorProps) => {
      mocks.editorProps.push(props);
      return ReactModule.createElement('div', {
        'data-testid': 'code-editor',
        'data-disabled': String(Boolean(props.disabled)),
      });
    },
  };
});

function createModel<T>(Model: new (...args: any[]) => T, use: string, props: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ [use]: Model });
  return engine.createModel<T>({
    use,
    uid: use,
    props,
  });
}

function getFlow(model: { getFlows: () => Map<string, any> }, key: string) {
  const flow = model.getFlows().get(key);
  expect(flow).toBeDefined();
  return flow;
}

describe('CodeField models', () => {
  afterEach(() => {
    cleanup();
    mocks.editorProps = [];
  });

  it('renders editable and display code editors with the expected props', () => {
    const codeModel = createModel(CodeFieldModel, 'CodeFieldModel', {
      value: 'const value = 1;',
      height: '300px',
    });
    const displayModel = createModel(DisplayCodeFieldModel, 'DisplayCodeFieldModel', {
      value: 'readonly',
      indentUnit: 4,
    });

    render(codeModel.render());
    render(displayModel.render());

    expect(screen.getAllByTestId('code-editor')).toHaveLength(2);
    expect(mocks.editorProps).toEqual([
      expect.objectContaining({
        value: 'const value = 1;',
        height: '300px',
      }),
      expect.objectContaining({
        value: 'readonly',
        indentUnit: 4,
        disabled: true,
      }),
    ]);
  });

  it('normalizes content setting flow params for editable fields', () => {
    const setProps = vi.fn();
    const model = createModel(CodeFieldModel, 'CodeFieldModel', {
      height: ' 250px ',
      indentUnit: '4',
    });
    const flow = getFlow(model, 'codeFieldSettings');
    const ctx = {
      model: {
        props: model.props,
        setProps,
      },
      t: (key: string) => key,
    };

    expect(flow.steps.height.defaultParams(ctx)).toEqual({ height: ' 250px ' });
    expect(flow.steps.height.uiMode(ctx)).toMatchObject({
      type: 'select',
      key: 'height',
    });
    expect(flow.steps.height.uiMode(ctx).props.dropdownRender(<div>height menu</div>, vi.fn(), vi.fn())).toBeTruthy();
    flow.steps.height.handler(ctx, { height: ' 360px ' });
    expect(setProps).toHaveBeenCalledWith({ height: '360px' });

    expect(flow.steps.indentUnit.defaultParams(ctx)).toEqual({ indentUnit: 4 });
    expect(flow.steps.indentUnit.uiMode(ctx)).toMatchObject({
      type: 'select',
      key: 'indentUnit',
    });
    expect(
      flow.steps.indentUnit.uiMode(ctx).props.dropdownRender(<div>indent menu</div>, vi.fn(), vi.fn()),
    ).toBeTruthy();
    flow.steps.indentUnit.handler(ctx, { indentUnit: 3.8 });
    expect(setProps).toHaveBeenCalledWith({ indentUnit: 3 });
  });

  it('uses the same content setting behavior for display fields', () => {
    const setProps = vi.fn();
    const model = createModel(DisplayCodeFieldModel, 'DisplayCodeFieldModel', {});
    const flow = getFlow(model, 'displayCodeFieldSettings');
    const ctx = {
      model: {
        props: {},
        setProps,
      },
      t: (key: string) => key,
    };

    expect(flow.steps.height.defaultParams(ctx)).toEqual({ height: 'auto' });
    expect(flow.steps.indentUnit.defaultParams(ctx)).toEqual({ indentUnit: 2 });
    expect(flow.steps.height.uiMode(ctx).props.dropdownRender(<div>height menu</div>, vi.fn(), vi.fn())).toBeTruthy();
    expect(
      flow.steps.indentUnit.uiMode(ctx).props.dropdownRender(<div>indent menu</div>, vi.fn(), vi.fn()),
    ).toBeTruthy();

    flow.steps.height.handler(ctx, { height: '' });
    flow.steps.indentUnit.handler(ctx, { indentUnit: 0 });

    expect(setProps).toHaveBeenCalledWith({ height: 'auto' });
    expect(setProps).toHaveBeenCalledWith({ indentUnit: 2 });
  });
});
