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
import { FieldModelRenderer } from '../../../../FieldModelRenderer';
import { FlowModelRenderer } from '../../../../FlowModelRenderer';
import { FlowsFloatContextMenu } from '../FlowsFloatContextMenu';

const mockColorTextTertiary = '#8c8c8c';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const Dropdown = (props: any) => {
    const { children, getPopupContainer, onOpenChange, open } = props;
    const ref = React.useRef<HTMLSpanElement>(null);
    const [popupContainer, setPopupContainer] = React.useState('');

    React.useEffect(() => {
      if (!ref.current || typeof getPopupContainer !== 'function') {
        setPopupContainer('');
        return;
      }

      const container = getPopupContainer(ref.current);
      setPopupContainer(container?.id || container?.className || container?.tagName?.toLowerCase() || '');
    }, [getPopupContainer, open]);

    return React.createElement(
      'span',
      {
        ref,
        'data-testid': 'dropdown',
        'data-open': open ? 'true' : 'false',
        'data-popup-container': popupContainer,
        'data-has-popup-container': typeof getPopupContainer === 'function' ? 'true' : 'false',
        onMouseEnter: () => onOpenChange?.(true, { source: 'trigger' }),
        onMouseLeave: () => onOpenChange?.(false, { source: 'trigger' }),
      },
      children,
    );
  };
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
  const Typography = {
    Paragraph: ({ children }: any) => React.createElement('p', null, children),
    Text: ({ children }: any) => React.createElement('span', null, children),
  };

  return {
    ...actual,
    Dropdown,
    App,
    ConfigProvider,
    Modal,
    Tooltip,
    Space,
    Alert,
    Select,
    Switch,
    Typography,
    theme: { ...actual.theme, useToken: () => ({ token: { colorTextTertiary: mockColorTextTertiary } }) },
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

const renderWithProviders = (engine: FlowEngine, ui: React.ReactNode, renderOptions?: Parameters<typeof render>[1]) => {
  return render(
    <ConfigProvider>
      <App>
        <FlowEngineProvider engine={engine}>{ui}</FlowEngineProvider>
      </App>
    </ConfigProvider>,
    renderOptions,
  );
};

const createAppContainer = () => {
  const container = document.createElement('div');
  container.id = 'nocobase-app-container';
  document.body.appendChild(container);
  return container;
};

const createPopupRoot = (
  className:
    | 'ant-drawer-content-wrapper'
    | 'ant-drawer-content'
    | 'ant-modal-wrap'
    | 'ant-modal-content'
    | 'ant-drawer-root'
    | 'ant-modal-root',
) => {
  const popupRoot = document.createElement('div');
  popupRoot.className = className;
  return popupRoot;
};

const setupDrawerPopup = () => {
  const appContainer = createAppContainer();
  const drawerWrapper = createPopupRoot('ant-drawer-content-wrapper');
  const drawerContent = createPopupRoot('ant-drawer-content');
  drawerContent.setAttribute('role', 'dialog');
  drawerWrapper.scrollTop = 14;
  drawerWrapper.scrollLeft = 9;
  drawerWrapper.appendChild(drawerContent);
  appContainer.appendChild(drawerWrapper);
  mockRect(appContainer, { top: 0, left: 0, width: 1280, height: 900 });
  mockRect(drawerWrapper, { top: 80, left: 200, width: 640, height: 520 });
  mockRect(drawerContent, { top: 96, left: 216, width: 624, height: 504 });
  return { drawerWrapper, drawerContent };
};

const getHost = (element: HTMLElement) => element.closest('[data-has-float-menu="true"]') as HTMLDivElement;
const queryOverlay = (container: HTMLElement, uid: string) =>
  container.querySelector(`[data-model-uid="${uid}"]`) as HTMLDivElement | null;

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
    document.body.innerHTML = '';
  });

  it('defaults to portal into app container and keeps toolbar visible while moving from host to toolbar', async () => {
    const engine = new FlowEngine();
    await engine.flowSettings.forceEnable();
    const model = createModel(engine, 'portal-model');
    const appContainer = createAppContainer();
    appContainer.scrollTop = 8;
    appContainer.scrollLeft = 6;
    mockRect(appContainer, { top: 100, left: 120, width: 960, height: 720 });

    const { getByTestId } = renderWithProviders(
      engine,
      <FlowsFloatContextMenu model={model}>
        <div data-testid="content">content</div>
      </FlowsFloatContextMenu>,
      { container: appContainer },
    );

    const host = getHost(getByTestId('content'));
    mockRect(host, { top: 112, left: 124, width: 160, height: 60 });

    expect(appContainer.querySelector('[data-model-uid="portal-model"]')).toBeNull();
    expect(host.querySelector('.nb-toolbar-container')).toBeNull();

    fireEvent.mouseEnter(host);

    const overlay = await waitFor(() => {
      const nextOverlay = appContainer.querySelector('[data-model-uid="portal-model"]') as HTMLDivElement | null;
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(overlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    await waitFor(() => {
      expect(overlay.className).toContain('nb-toolbar-visible');
      expect(overlay.className).toContain('nb-toolbar-portal-absolute');
      expect(overlay.style.top).toBe('20px');
      expect(overlay.style.left).toBe('10px');
      expect(overlay.style.width).toBe('160px');
      expect(overlay.style.height).toBe('60px');
      expect(overlay.parentElement).toBe(appContainer);
    });

    const icons = overlay.querySelector('.nb-toolbar-container-icons') as HTMLDivElement;
    const dropdown = within(overlay).getByTestId('dropdown');
    expect(dropdown.getAttribute('data-popup-container')).toContain('nb-toolbar-container-icons');
    fireEvent.mouseLeave(host, { relatedTarget: icons });
    fireEvent.mouseEnter(icons, { relatedTarget: host });

    await waitFor(() => {
      expect(overlay.className).toContain('nb-toolbar-visible');
    });

    fireEvent.mouseLeave(icons);

    await waitFor(() => {
      expect(queryOverlay(appContainer, 'portal-model')).toBeNull();
    });
  });

  it('renders through FlowModelRenderer with app-container portal and keeps toolbar pinned while dropdown is open', async () => {
    const engine = new FlowEngine();
    await engine.flowSettings.forceEnable();
    const model = createModel(engine, 'renderer-model');
    const appContainer = createAppContainer();
    mockRect(appContainer, { top: 40, left: 60, width: 1200, height: 800 });

    const { findByTestId } = renderWithProviders(
      engine,
      <FlowModelRenderer model={model} showFlowSettings={{ toolbarPosition: 'above' }} />,
      { container: appContainer },
    );

    const content = await findByTestId('renderer-model-content');
    const host = getHost(content);
    mockRect(host, { top: 100, left: 150, width: 180, height: 72 });

    expect(appContainer.querySelector('[data-model-uid="renderer-model"]')).toBeNull();

    fireEvent.mouseEnter(host);

    const overlay = await waitFor(() => {
      const nextOverlay = appContainer.querySelector('[data-model-uid="renderer-model"]') as HTMLDivElement | null;
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(overlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    await waitFor(() => {
      expect(overlay.className).toContain('nb-toolbar-visible');
      expect(overlay.className).toContain('nb-toolbar-portal-absolute');
    });

    const icons = overlay.querySelector('.nb-toolbar-container-icons') as HTMLDivElement;
    const dropdown = within(overlay).getByTestId('dropdown');
    expect(icons.className).toContain('nb-toolbar-position-above');
    expect(dropdown.getAttribute('data-popup-container')).toContain('nb-toolbar-container-icons');

    fireEvent.mouseEnter(icons);
    fireEvent.mouseEnter(dropdown);

    await waitFor(() => {
      expect(dropdown.getAttribute('data-open')).toBe('true');
    });

    fireEvent.mouseLeave(icons);

    await waitFor(() => {
      expect(overlay.className).toContain('nb-toolbar-visible');
    });

    fireEvent.mouseLeave(dropdown);
    fireEvent.mouseLeave(icons);

    await waitFor(() => {
      expect(queryOverlay(appContainer, 'renderer-model')).toBeNull();
    });
  });

  it('portals field toolbar to the nearest popup root and treats inset values as rect adjustments', async () => {
    const engine = new FlowEngine();
    await engine.flowSettings.forceEnable();
    const model = createModel(engine, 'field-model');
    model.render = vi.fn().mockReturnValue(<input data-testid="field-input" />);
    const insetModel = createModel(engine, 'field-inset-model');
    insetModel.render = vi.fn().mockReturnValue(<input data-testid="field-inset-input" />);
    const { drawerWrapper, drawerContent } = setupDrawerPopup();

    const { findByTestId } = renderWithProviders(
      engine,
      <>
        <FieldModelRenderer model={model} showFlowSettings={{ toolbarPosition: 'inside' }} />
        <FieldModelRenderer
          model={insetModel}
          showFlowSettings={{
            toolbarPosition: 'inside',
            style: {
              top: -6,
              left: -6,
              right: -6,
              bottom: -6,
            },
          }}
        />
      </>,
      { container: drawerContent },
    );

    const input = await findByTestId('field-input');
    const insetInput = await findByTestId('field-inset-input');
    const host = getHost(input);
    const insetHost = getHost(insetInput);
    mockRect(host, { top: 140, left: 280, width: 220, height: 48 });
    mockRect(insetHost, { top: 220, left: 320, width: 220, height: 48 });

    expect(drawerWrapper.querySelector('[data-model-uid="field-model"]')).toBeNull();
    expect(drawerWrapper.querySelector('[data-model-uid="field-inset-model"]')).toBeNull();

    fireEvent.mouseEnter(host);

    const overlay = await waitFor(() => {
      const nextOverlay = drawerWrapper.querySelector('[data-model-uid="field-model"]') as HTMLDivElement | null;
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(overlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    await waitFor(() => {
      expect(overlay.className).toContain('nb-toolbar-portal-absolute');
      expect(overlay.style.top).toBe('74px');
      expect(overlay.style.left).toBe('89px');
      expect(overlay.style.width).toBe('220px');
      expect(overlay.style.height).toBe('48px');
      expect(overlay.parentElement).toBe(drawerWrapper);
    });

    fireEvent.mouseEnter(insetHost);

    const insetOverlay = await waitFor(() => {
      const nextOverlay = drawerWrapper.querySelector('[data-model-uid="field-inset-model"]') as HTMLDivElement | null;
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(insetOverlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    await waitFor(() => {
      expect(insetOverlay.className).toContain('nb-toolbar-portal-absolute');
      expect(insetOverlay.style.top).toBe('148px');
      expect(insetOverlay.style.left).toBe('123px');
      expect(insetOverlay.style.width).toBe('232px');
      expect(insetOverlay.style.height).toBe('60px');
      expect(insetOverlay.parentElement).toBe(drawerWrapper);
      expect(insetOverlay.style.right).toBe('');
      expect(insetOverlay.style.bottom).toBe('');
    });
  });

  it('hides parent toolbar when hovering a nested child host', async () => {
    const engine = new FlowEngine();
    await engine.flowSettings.forceEnable();
    const parentModel = createModel(engine, 'parent-model');
    const childModel = createModel(engine, 'child-model');
    const appContainer = createAppContainer();
    mockRect(appContainer, { top: 0, left: 0, width: 1280, height: 900 });

    const { getByTestId } = renderWithProviders(
      engine,
      <FlowsFloatContextMenu model={parentModel}>
        <div data-testid="parent-content">
          <FlowsFloatContextMenu model={childModel}>
            <div data-testid="child-content">child</div>
          </FlowsFloatContextMenu>
        </div>
      </FlowsFloatContextMenu>,
      { container: appContainer },
    );

    const parentHost = getHost(getByTestId('parent-content'));
    const childHost = getHost(getByTestId('child-content'));
    mockRect(parentHost, { top: 10, left: 10, width: 240, height: 120 });
    mockRect(childHost, { top: 28, left: 36, width: 120, height: 48 });

    expect(appContainer.querySelector('[data-model-uid="parent-model"]')).toBeNull();
    expect(appContainer.querySelector('[data-model-uid="child-model"]')).toBeNull();

    fireEvent.mouseEnter(parentHost);

    const parentOverlay = await waitFor(() => {
      const nextOverlay = appContainer.querySelector('[data-model-uid="parent-model"]') as HTMLDivElement | null;
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(parentOverlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    await waitFor(() => {
      expect(parentOverlay.className).toContain('nb-toolbar-visible');
    });

    fireEvent.mouseEnter(childHost);
    fireEvent.mouseMove(childHost);

    const childOverlay = await waitFor(() => {
      const nextOverlay = appContainer.querySelector('[data-model-uid="child-model"]') as HTMLDivElement | null;
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(childOverlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    await waitFor(() => {
      expect(queryOverlay(appContainer, 'child-model')?.className).toContain('nb-toolbar-visible');
      expect(queryOverlay(appContainer, 'parent-model')).toBeNull();
    });

    fireEvent.mouseLeave(childHost, { relatedTarget: document.createElement('div') });

    await waitFor(() => {
      expect(queryOverlay(appContainer, 'child-model')?.className).toContain('nb-toolbar-visible');
      expect(queryOverlay(appContainer, 'parent-model')).toBeNull();
    });
  });

  it('restores parent toolbar after leaving a child toolbar back into the parent block', async () => {
    const engine = new FlowEngine();
    await engine.flowSettings.forceEnable();
    const parentModel = createModel(engine, 'parent-restore-model');
    const childModel = createModel(engine, 'child-restore-model');
    const appContainer = createAppContainer();
    mockRect(appContainer, { top: 0, left: 0, width: 1280, height: 900 });

    const { getByTestId } = renderWithProviders(
      engine,
      <FlowsFloatContextMenu model={parentModel}>
        <div data-testid="parent-content">
          <div data-testid="parent-gap">gap</div>
          <FlowsFloatContextMenu model={childModel}>
            <div data-testid="child-content">child</div>
          </FlowsFloatContextMenu>
        </div>
      </FlowsFloatContextMenu>,
      { container: appContainer },
    );

    const parentHost = getHost(getByTestId('parent-content'));
    const childHost = getHost(getByTestId('child-content'));
    const parentGap = getByTestId('parent-gap');
    mockRect(parentHost, { top: 10, left: 10, width: 320, height: 160 });
    mockRect(childHost, { top: 28, left: 36, width: 120, height: 48 });

    fireEvent.mouseEnter(parentHost);

    const parentOverlay = await waitFor(() => {
      const nextOverlay = queryOverlay(appContainer, 'parent-restore-model');
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(parentOverlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    fireEvent.mouseEnter(childHost);
    fireEvent.mouseMove(childHost);

    const childOverlay = await waitFor(() => {
      const nextOverlay = queryOverlay(appContainer, 'child-restore-model');
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(childOverlay).getByLabelText('flows-settings')).toBeTruthy();
      expect(queryOverlay(appContainer, 'parent-restore-model')).toBeNull();
    });

    const childIcons = childOverlay.querySelector('.nb-toolbar-container-icons') as HTMLDivElement;

    fireEvent.mouseLeave(parentHost, { relatedTarget: childIcons });
    fireEvent.mouseLeave(childHost, { relatedTarget: childIcons });
    fireEvent.mouseEnter(childIcons, { relatedTarget: childHost });

    await waitFor(() => {
      expect(queryOverlay(appContainer, 'child-restore-model')?.className).toContain('nb-toolbar-visible');
      expect(queryOverlay(appContainer, 'parent-restore-model')).toBeNull();
    });

    fireEvent.mouseLeave(childIcons, { relatedTarget: parentGap });
    fireEvent.mouseEnter(parentHost, { relatedTarget: childIcons });
    fireEvent.mouseEnter(parentGap, { relatedTarget: childIcons });
    fireEvent.mouseMove(parentGap);

    await waitFor(() => {
      expect(queryOverlay(appContainer, 'child-restore-model')).toBeNull();
      const parentOverlayAfterRestore = queryOverlay(appContainer, 'parent-restore-model');
      expect(parentOverlayAfterRestore).toBeTruthy();
      expect(parentOverlayAfterRestore?.className).toContain('nb-toolbar-visible');
    });
  });

  it('treats forked models as distinct float menu instances even when they share the same uid', async () => {
    const engine = new FlowEngine();
    await engine.flowSettings.forceEnable();
    const masterModel = new FlowModel({ uid: 'forked-model', flowEngine: engine });
    masterModel.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });
    masterModel.render = vi.fn(function (this: any) {
      return <div data-testid={`content-${String(this.forkId || this.uid)}`}>{String(this.forkId || this.uid)}</div>;
    });

    const firstFork = masterModel.createFork({}, 'card-1') as FlowModel & { forkId?: string };
    const secondFork = masterModel.createFork({}, 'card-2') as FlowModel & { forkId?: string };
    const firstInstanceId = `forked-model::${String((firstFork as any).forkId)}`;
    const secondInstanceId = `forked-model::${String((secondFork as any).forkId)}`;
    const appContainer = createAppContainer();
    mockRect(appContainer, { top: 0, left: 0, width: 1280, height: 900 });

    const { getByTestId } = renderWithProviders(
      engine,
      <>
        <FlowsFloatContextMenu model={firstFork}>
          <div data-testid="fork-host-1">first</div>
        </FlowsFloatContextMenu>
        <FlowsFloatContextMenu model={secondFork}>
          <div data-testid="fork-host-2">second</div>
        </FlowsFloatContextMenu>
      </>,
      { container: appContainer },
    );

    const firstHost = getHost(getByTestId('fork-host-1'));
    const secondHost = getHost(getByTestId('fork-host-2'));
    mockRect(firstHost, { top: 20, left: 20, width: 180, height: 72 });
    mockRect(secondHost, { top: 120, left: 20, width: 180, height: 72 });

    fireEvent.mouseEnter(firstHost);

    const firstOverlay = await waitFor(() => {
      const nextOverlay = queryOverlay(appContainer, firstInstanceId);
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(firstOverlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    fireEvent.mouseEnter(secondHost);

    const secondOverlay = await waitFor(() => {
      const nextOverlay = queryOverlay(appContainer, secondInstanceId);
      expect(nextOverlay).toBeTruthy();
      return nextOverlay as HTMLDivElement;
    });

    await waitFor(() => {
      expect(within(secondOverlay).getByLabelText('flows-settings')).toBeTruthy();
    });

    expect(firstOverlay.getAttribute('data-model-uid')).toBe(firstInstanceId);
    expect(secondOverlay.getAttribute('data-model-uid')).toBe(secondInstanceId);
  });
});
