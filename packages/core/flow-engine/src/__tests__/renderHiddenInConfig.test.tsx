/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { FlowEngine } from '../flowEngine';
import { FlowModel, ModelRenderMode } from '../models/flowModel';

describe('FlowModel.renderHiddenInConfig', () => {
  it('renders via renderHiddenInConfig when hidden and config enabled (React element mode, mounted)', () => {
    class ElemModel extends FlowModel {
      render() {
        return <div data-testid="content">Content</div>;
      }
      protected renderHiddenInConfig(): React.ReactNode | undefined {
        return <div data-testid="hidden">HiddenViaAPI</div>;
      }
    }

    const engine = new FlowEngine();
    const model = new ElemModel({ uid: 'elem-1', flowEngine: engine });

    // runtime hidden => mounted result should be empty (no content/hidden)
    engine.flowSettings.disable();
    model.setHidden(true);
    const { container, unmount, rerender } = render(model.render() as React.ReactElement);
    expect(screen.queryByTestId('content')).toBeNull();
    expect(screen.queryByTestId('hidden')).toBeNull();

    // config enabled + hidden => should show renderHiddenInConfig result
    engine.flowSettings.enable();
    rerender(model.render() as React.ReactElement);
    expect(screen.getByTestId('hidden').textContent).toBe('HiddenViaAPI');

    // visible => show original render
    model.setHidden(false);
    rerender(model.render() as React.ReactElement);
    expect(screen.getByTestId('content').textContent).toBe('Content');
    unmount();
    cleanup();
  });
  it('returns a render function when hidden and config enabled (RenderFunction mode)', () => {
    class FuncModel extends FlowModel {
      static override renderMode = ModelRenderMode.RenderFunction;
      render() {
        return () => <span>Cell</span>;
      }
      protected renderHiddenInConfig(): React.ReactNode | undefined {
        // return a cell renderer
        return <span>No permission</span>;
      }
    }

    const engine = new FlowEngine();
    engine.registerModels({ FuncModel: FuncModel });
    const model = engine.createModel({ use: 'FuncModel' }) as FuncModel;

    // runtime hidden => null
    engine.flowSettings.disable();
    model.setHidden(true);
    const runtimeHidden = model.render();
    expect(runtimeHidden).toBeNull();

    // config enabled + hidden => renderHiddenInConfig (function)
    engine.flowSettings.enable();
    const cfgHidden = model.render();
    expect(typeof cfgHidden).toBe('function');
    const cellNode = (cfgHidden as any)();
    // Allow either a React element or a plain string depending on environment/mocks
    if (typeof cellNode === 'string') {
      expect(cellNode).toBe('No permission');
    } else {
      expect(cellNode && typeof cellNode === 'object').toBe(true);
      expect((cellNode as any).props?.children).toBe('No permission');
    }

    // visible => original render (function)
    model.setHidden(false);
    const visible = model.render();
    expect(typeof visible).toBe('function');
    const visibleNode = (visible as any)();
    expect(visibleNode.props.children).toBe('Cell');
  });
});
