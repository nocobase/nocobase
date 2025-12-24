/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import { FlowEngineProvider } from '../../provider';
import { FlowModelRenderer } from '../FlowModelRenderer';

describe('FlowModelRenderer', () => {
  let flowEngine: FlowEngine;
  let model: FlowModel;

  beforeEach(() => {
    flowEngine = new FlowEngine();
    model = new FlowModel({
      uid: 'test-model',
      flowEngine,
    });
    // Mock dispatchEvent to track calls
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    // Mock render to return something
    model.render = vi.fn().mockReturnValue(<div>Model Content</div>);
  });

  const renderWithProvider = (ui: React.ReactNode) => {
    return render(<FlowEngineProvider engine={flowEngine}>{ui}</FlowEngineProvider>);
  };

  test('should pass useCache to useApplyAutoFlows and set it on context', async () => {
    const { unmount } = renderWithProvider(<FlowModelRenderer model={model} useCache={true} />);

    // Check if dispatchEvent was called with useCache: true
    // useApplyAutoFlows calls dispatchEvent('beforeRender', inputArgs, { useCache })
    await waitFor(() => {
      expect(model.dispatchEvent).toHaveBeenCalledWith(
        'beforeRender',
        undefined,
        expect.objectContaining({ useCache: true }),
      );
    });

    // Check if useCache is set on context
    expect(model.context.useCache).toBe(true);

    unmount();
  });

  test('should pass useCache=false to useApplyAutoFlows and set it on context', async () => {
    const { unmount } = renderWithProvider(<FlowModelRenderer model={model} useCache={false} />);

    await waitFor(() => {
      expect(model.dispatchEvent).toHaveBeenCalledWith(
        'beforeRender',
        undefined,
        expect.objectContaining({ useCache: false }),
      );
    });

    expect(model.context.useCache).toBe(false);

    unmount();
  });

  test('should not pass useCache if not provided', async () => {
    const { unmount } = renderWithProvider(<FlowModelRenderer model={model} />);

    await waitFor(() => {
      expect(model.dispatchEvent).toHaveBeenCalledWith(
        'beforeRender',
        undefined,
        expect.objectContaining({ useCache: undefined }),
      );
    });

    // context.useCache should be undefined (or default)
    expect(model.context.useCache).toBeUndefined();

    unmount();
  });
});

describe('FlowModelRenderer showFlowSettings.recursive', () => {
  let flowEngine: FlowEngine;

  function getFloatMenus(container: HTMLElement) {
    return Array.from(container.querySelectorAll('[data-has-float-menu="true"]'));
  }

  function hasTestId(el: Element, id: string) {
    return !!el.querySelector(`[data-testid="${id}"]`);
  }

  beforeEach(() => {
    flowEngine = new FlowEngine();
    flowEngine.flowSettings.forceEnable();
  });

  const createModel = (uid: string) => {
    const model = new FlowModel({ uid, flowEngine });
    model.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    return model;
  };

  const renderWithProvider = (ui: React.ReactNode) => {
    return render(<FlowEngineProvider engine={flowEngine}>{ui}</FlowEngineProvider>);
  };

  it('inherits enabled from nearest recursive ancestor; non-recursive explicit override does not affect descendants', async () => {
    const A = createModel('A');
    const B = createModel('B');
    const C = createModel('C');

    C.render = vi.fn().mockReturnValue(<div data-testid="C">C</div>);
    B.render = vi.fn().mockReturnValue(
      <div data-testid="B">
        B
        <FlowModelRenderer model={C} />
      </div>,
    );
    A.render = vi.fn().mockReturnValue(
      <div data-testid="A">
        A
        <FlowModelRenderer model={B} showFlowSettings={false} />
      </div>,
    );

    const { container } = renderWithProvider(<FlowModelRenderer model={A} showFlowSettings={{ recursive: true }} />);

    await waitFor(() => {
      const menus = getFloatMenus(container);
      // A (recursive enabled) + C (inherits enabled from A) => 2 menus
      expect(menus).toHaveLength(2);
      // outer: A
      expect(menus.some((m) => hasTestId(m, 'A'))).toBe(true);
      // B is explicitly disabled, so no "B-only" menu (contains B but not A)
      expect(menus.some((m) => hasTestId(m, 'B') && !hasTestId(m, 'A'))).toBe(false);
      // C menu exists (contains C but not A/B)
      expect(menus.some((m) => hasTestId(m, 'C') && !hasTestId(m, 'A') && !hasTestId(m, 'B'))).toBe(true);
    });
  });

  it('descendants follow a child override only when that child sets recursive:true', async () => {
    const A = createModel('A');
    const B = createModel('B');
    const C = createModel('C');

    C.render = vi.fn().mockReturnValue(<div data-testid="C">C</div>);
    B.render = vi.fn().mockReturnValue(
      <div data-testid="B">
        B
        <FlowModelRenderer model={C} />
      </div>,
    );
    A.render = vi.fn().mockReturnValue(
      <div data-testid="A">
        A
        <FlowModelRenderer model={B} showFlowSettings={{ enabled: false, recursive: true }} />
      </div>,
    );

    const { container } = renderWithProvider(<FlowModelRenderer model={A} showFlowSettings={{ recursive: true }} />);

    await waitFor(() => {
      const menus = getFloatMenus(container);
      // Only A is enabled; B disables itself and propagates disable to descendants
      expect(menus).toHaveLength(1);
      expect(menus.some((m) => hasTestId(m, 'A'))).toBe(true);
      expect(menus.some((m) => hasTestId(m, 'B') && !hasTestId(m, 'A'))).toBe(false);
      expect(menus.some((m) => hasTestId(m, 'C') && !hasTestId(m, 'A') && !hasTestId(m, 'B'))).toBe(false);
    });
  });

  it('explicit recursive:false blocks inheritance for descendants', async () => {
    const A = createModel('A');
    const B = createModel('B');
    const C = createModel('C');

    C.render = vi.fn().mockReturnValue(<div data-testid="C">C</div>);
    B.render = vi.fn().mockReturnValue(
      <div data-testid="B">
        B
        <FlowModelRenderer model={C} />
      </div>,
    );
    A.render = vi.fn().mockReturnValue(
      <div data-testid="A">
        A
        <FlowModelRenderer model={B} showFlowSettings={{ enabled: false, recursive: false }} />
      </div>,
    );

    const { container } = renderWithProvider(<FlowModelRenderer model={A} showFlowSettings={{ recursive: true }} />);

    await waitFor(() => {
      const menus = getFloatMenus(container);
      // A (recursive enabled) + B blocks inheritance => only A menu
      expect(menus).toHaveLength(1);
      expect(menus.some((m) => hasTestId(m, 'A'))).toBe(true);
      expect(menus.some((m) => hasTestId(m, 'B') && !hasTestId(m, 'A'))).toBe(false);
      expect(menus.some((m) => hasTestId(m, 'C') && !hasTestId(m, 'A') && !hasTestId(m, 'B'))).toBe(false);
    });
  });

  it('explicit enabled overrides inherited disabled for itself', async () => {
    const A = createModel('A');
    const B = createModel('B');
    const C = createModel('C');

    C.render = vi.fn().mockReturnValue(<div data-testid="C">C</div>);
    B.render = vi.fn().mockReturnValue(
      <div data-testid="B">
        B
        <FlowModelRenderer model={C} />
      </div>,
    );
    A.render = vi.fn().mockReturnValue(
      <div data-testid="A">
        A
        <FlowModelRenderer model={B} showFlowSettings />
      </div>,
    );

    const { container } = renderWithProvider(
      <FlowModelRenderer model={A} showFlowSettings={{ enabled: false, recursive: true }} />,
    );

    await waitFor(() => {
      const menus = getFloatMenus(container);
      // A is disabled; B explicitly enabled for itself => 1 menu (B only)
      expect(menus).toHaveLength(1);
      expect(menus.some((m) => hasTestId(m, 'A'))).toBe(false);
      expect(menus.some((m) => hasTestId(m, 'B') && !hasTestId(m, 'A'))).toBe(true);
      expect(menus.some((m) => hasTestId(m, 'C') && !hasTestId(m, 'A') && !hasTestId(m, 'B'))).toBe(false);
    });
  });

  it('without any recursive:true ancestor, behavior stays the same (no inheritance)', async () => {
    const A = createModel('A');
    const B = createModel('B');
    const C = createModel('C');

    C.render = vi.fn().mockReturnValue(<div data-testid="C">C</div>);
    B.render = vi.fn().mockReturnValue(
      <div data-testid="B">
        B
        <FlowModelRenderer model={C} />
      </div>,
    );
    A.render = vi.fn().mockReturnValue(
      <div data-testid="A">
        A
        <FlowModelRenderer model={B} />
      </div>,
    );

    const { container } = renderWithProvider(<FlowModelRenderer model={A} showFlowSettings />);

    await waitFor(() => {
      const menus = getFloatMenus(container);
      // Only A explicitly enabled; B/C are default (disabled) because there is no recursive inheritance
      expect(menus).toHaveLength(1);
      expect(menus.some((m) => hasTestId(m, 'A'))).toBe(true);
      expect(menus.some((m) => hasTestId(m, 'B') && !hasTestId(m, 'A'))).toBe(false);
      expect(menus.some((m) => hasTestId(m, 'C') && !hasTestId(m, 'A') && !hasTestId(m, 'B'))).toBe(false);
    });
  });
});
