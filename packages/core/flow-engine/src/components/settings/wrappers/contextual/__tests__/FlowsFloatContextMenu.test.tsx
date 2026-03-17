/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { FlowEngine } from '../../../../../flowEngine';
import { FlowModel } from '../../../../../models/flowModel';
import { FlowEngineProvider } from '../../../../../provider';
import { FlowModelRenderer } from '../../../../FlowModelRenderer';
import { FlowsFloatContextMenu } from '../FlowsFloatContextMenu';

const mockColorTextTertiary = '#8c8c8c';

vi.mock('antd', () => {
  const Dropdown = (props: any) => React.createElement('span', { 'data-testid': 'dropdown' }, props.children);
  const App = Object.assign(({ children }: any) => React.createElement(React.Fragment, null, children), {
    useApp: () => ({ message: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }),
  });
  const ConfigProvider = ({ children }: any) => React.createElement(React.Fragment, null, children);
  const Modal = {
    confirm: vi.fn(),
    error: vi.fn(),
  };
  const Tooltip = ({ children }: any) => React.createElement('span', null, children);
  const Space = ({ children }: any) => React.createElement('div', null, children);
  const Alert = (props: any) => React.createElement('div', { role: 'alert' }, props.message ?? 'Alert');
  const Select = (props: any) => React.createElement('select', props);
  const Switch = (props: any) => React.createElement('input', { ...props, type: 'checkbox' });

  return {
    Dropdown,
    App,
    ConfigProvider,
    Modal,
    Tooltip,
    Space,
    Alert,
    Select,
    Switch,
    theme: { useToken: () => ({ token: { colorTextTertiary: mockColorTextTertiary } }) },
  } as any;
});

const createRect = ({ top, left, width, height }: { top: number; left: number; width: number; height: number }) => ({
  x: left,
  y: top,
  top,
  left,
  width,
  height,
  right: left + width,
  bottom: top + height,
  toJSON: () => '',
});

const mockRect = (element: HTMLElement, rect: { top: number; left: number; width: number; height: number }) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => createRect(rect),
  });
};

const renderWithProviders = (engine: FlowEngine, ui: React.ReactNode) => {
  return render(
    <ConfigProvider>
      <App>
        <FlowEngineProvider engine={engine}>{ui}</FlowEngineProvider>
      </App>
    </ConfigProvider>,
  );
};

const createModel = (engine: FlowEngine, uid: string) => {
  const model = new FlowModel({ uid, flowEngine: engine });
  model.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });
  model.render = vi.fn().mockReturnValue(<div data-testid={`${uid}-content`}>{uid}</div>);
  return model;
};

describe('FlowsFloatContextMenu', () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeEach(() => {
    globalThis.ResizeObserver = class {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    } as any;

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn() as any;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    globalThis.ResizeObserver = originalResizeObserver;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('uses a portal toolbar by default and keeps it visible while moving from host to toolbar', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    const model = createModel(engine, 'portal-model');

    const { getByTestId } = renderWithProviders(
      engine,
      <FlowsFloatContextMenu model={model}>
        <div data-testid="content">content</div>
      </FlowsFloatContextMenu>,
    );

    const host = getByTestId('content').parentElement as HTMLDivElement;
    mockRect(host, { top: 12, left: 24, width: 160, height: 60 });

    const overlay = document.body.querySelector('[data-model-uid="portal-model"]') as HTMLDivElement;
    expect(overlay).toBeTruthy();
    expect(host.querySelector('.nb-toolbar-container')).toBeNull();

    await waitFor(() => {
      expect(within(overlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    fireEvent.mouseEnter(host);

    await waitFor(() => {
      expect(overlay.dataset.toolbarVisible).toBe('true');
      expect(overlay.dataset.toolbarRenderMode).toBe('portal');
      expect(overlay.style.top).toBe('12px');
      expect(overlay.style.left).toBe('24px');
      expect(overlay.style.width).toBe('160px');
      expect(overlay.style.height).toBe('60px');
    });

    const icons = overlay.querySelector('.nb-toolbar-container-icons') as HTMLDivElement;
    fireEvent.mouseLeave(host, { relatedTarget: icons });
    fireEvent.mouseEnter(icons, { relatedTarget: host });

    await waitFor(() => {
      expect(overlay.dataset.toolbarVisible).toBe('true');
    });

    fireEvent.mouseLeave(icons);

    await waitFor(() => {
      expect(overlay.dataset.toolbarVisible).toBe('false');
    });
  });

  it('keeps toolbar position semantics in portal mode and renders through FlowModelRenderer by default', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    const model = createModel(engine, 'renderer-model');

    const { getByTestId } = renderWithProviders(
      engine,
      <FlowModelRenderer model={model} showFlowSettings={{ toolbarPosition: 'above' }} />,
    );

    const host = getByTestId('renderer-model-content').parentElement as HTMLDivElement;
    mockRect(host, { top: 20, left: 30, width: 180, height: 72 });

    const overlay = document.body.querySelector('[data-model-uid="renderer-model"]') as HTMLDivElement;
    expect(overlay).toBeTruthy();

    await waitFor(() => {
      expect(within(overlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    fireEvent.mouseEnter(host);

    await waitFor(() => {
      expect(overlay.dataset.toolbarRenderMode).toBe('portal');
      expect(overlay.dataset.toolbarPosition).toBe('above');
      expect(overlay.dataset.toolbarVisible).toBe('true');
    });

    const icons = overlay.querySelector('.nb-toolbar-container-icons') as HTMLDivElement;
    expect(icons.className).toContain('nb-toolbar-position-above');
  });

  it('hides parent toolbar when hovering a nested child host', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    const parentModel = createModel(engine, 'parent-model');
    const childModel = createModel(engine, 'child-model');

    const { getByTestId } = renderWithProviders(
      engine,
      <FlowsFloatContextMenu model={parentModel}>
        <div data-testid="parent-content">
          <FlowsFloatContextMenu model={childModel}>
            <div data-testid="child-content">child</div>
          </FlowsFloatContextMenu>
        </div>
      </FlowsFloatContextMenu>,
    );

    const parentHost = getByTestId('parent-content').parentElement as HTMLDivElement;
    const childHost = getByTestId('child-content').parentElement as HTMLDivElement;
    mockRect(parentHost, { top: 10, left: 10, width: 240, height: 120 });
    mockRect(childHost, { top: 28, left: 36, width: 120, height: 48 });

    const parentOverlay = document.body.querySelector('[data-model-uid="parent-model"]') as HTMLDivElement;
    const childOverlay = document.body.querySelector('[data-model-uid="child-model"]') as HTMLDivElement;

    await waitFor(() => {
      expect(within(parentOverlay).getByLabelText('flows-settings')).toBeTruthy();
      expect(within(childOverlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    fireEvent.mouseEnter(parentHost);

    await waitFor(() => {
      expect(parentOverlay.dataset.toolbarVisible).toBe('true');
    });

    fireEvent.mouseEnter(childHost);
    fireEvent.mouseMove(childHost);

    await waitFor(() => {
      expect(childOverlay.dataset.toolbarVisible).toBe('true');
      expect(parentOverlay.dataset.toolbarVisible).toBe('false');
    });
  });

  it('keeps inline mode as an escape hatch', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    const model = createModel(engine, 'inline-model');

    const { getByTestId } = renderWithProviders(
      engine,
      <FlowsFloatContextMenu model={model} toolbarRenderMode="inline">
        <div data-testid="inline-content">content</div>
      </FlowsFloatContextMenu>,
    );

    const host = getByTestId('inline-content').parentElement as HTMLDivElement;
    mockRect(host, { top: 16, left: 18, width: 120, height: 40 });

    const overlay = host.querySelector('[data-model-uid="inline-model"]') as HTMLDivElement;
    expect(overlay).toBeTruthy();

    await waitFor(() => {
      expect(within(overlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    fireEvent.mouseEnter(host);

    await waitFor(() => {
      expect(overlay.dataset.toolbarRenderMode).toBe('inline');
      expect(overlay.dataset.toolbarVisible).toBe('true');
      expect(overlay.parentElement).toBe(host);
    });
  });
});
