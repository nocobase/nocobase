/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowPage } from '../FlowPage';
import { RouteModel } from '../models/base/RouteModel';
import { loadRouteContentForEditing } from '../FlowModelRepository';

vi.mock('../FlowModelRepository', () => ({
  loadRouteContentForEditing: vi.fn(),
  isRouteContentConfirmed: () => false,
}));

type TestContextProperty = {
  value?: unknown;
  get?: () => unknown;
};

type TestModelContext = {
  isMobileLayout: boolean;
  themeToken: {
    marginBlock: number;
  };
  addDelegate: ReturnType<typeof vi.fn>;
  defineProperty: ReturnType<typeof vi.fn>;
};

type TestPageModel = {
  uid: string;
  props: {
    showFlowSettings: boolean;
  };
  context: TestModelContext;
  removeParentDelegate: ReturnType<typeof vi.fn>;
};

type RendererProps = {
  model?: TestPageModel;
  showFlowSettings?: boolean;
} & Record<string, unknown>;

const defineContextProperty = (context: TestModelContext, key: string, property: TestContextProperty) => {
  Object.defineProperty(context, key, {
    configurable: true,
    enumerable: true,
    get: property.get || (() => property.value),
  });
};

const createPageModel = (): TestPageModel => {
  const context = {
    isMobileLayout: false,
    themeToken: {
      marginBlock: 16,
    },
    addDelegate: vi.fn(),
    defineProperty: vi.fn((key: string, property: TestContextProperty) => {
      defineContextProperty(context, key, property);
    }),
  };

  return {
    uid: 'public-form-page',
    props: {
      showFlowSettings: false,
    },
    context,
    removeParentDelegate: vi.fn(),
  };
};

const mocks = vi.hoisted(() => ({
  loadModel: vi.fn(),
  loadOrCreateModel: vi.fn(),
  rendererMobileStates: [] as boolean[],
  rendererProps: undefined as RendererProps | undefined,
  model: undefined as TestPageModel | undefined,
  viewFilterByTk: undefined as unknown,
  viewInputMobileLayout: true as boolean | undefined,
  viewSourceId: undefined as unknown,
  contextMobileLayout: undefined as boolean | undefined,
}));

const editor = observable({ enabled: false });

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  const ReactModule = await import('react');
  class TestPageModelClass {}

  return {
    ...actual,
    FlowModelRenderer: vi.fn((props: RendererProps) => {
      mocks.rendererProps = props;
      if (typeof props.model?.context.isMobileLayout === 'boolean') {
        mocks.rendererMobileStates.push(props.model.context.isMobileLayout);
      }
      return ReactModule.createElement('input', { 'data-testid': 'flow-model-renderer' });
    }),
    useFlowEngine: vi.fn(() => ({
      getModel: () => Object.create(RouteModel.prototype),
      getModelClassAsync: vi.fn(async () => TestPageModelClass),
      loadModel: mocks.loadModel,
      loadOrCreateModel: mocks.loadOrCreateModel,
      context: {
        get flowSettingsEnabled() {
          return editor.enabled;
        },
      },
      translate: vi.fn((value: string) => value),
    })),
    useFlowModelById: vi.fn(() => mocks.model),
    useFlowViewContext: vi.fn(() => ({
      view: {
        inputArgs: {
          ...(typeof mocks.viewFilterByTk !== 'undefined' ? { filterByTk: mocks.viewFilterByTk } : {}),
          ...(typeof mocks.viewInputMobileLayout === 'boolean' ? { isMobileLayout: mocks.viewInputMobileLayout } : {}),
          ...(typeof mocks.viewSourceId !== 'undefined' ? { sourceId: mocks.viewSourceId } : {}),
        },
      },
      ...(typeof mocks.contextMobileLayout === 'boolean' ? { isMobileLayout: mocks.contextMobileLayout } : {}),
      themeToken: {
        marginBlock: 16,
      },
    })),
  };
});

describe('FlowPage', () => {
  beforeEach(() => {
    mocks.loadModel.mockImplementation(async () => null);
    mocks.loadOrCreateModel.mockImplementation(async () => mocks.model);
  });

  afterEach(() => {
    act(() => {
      editor.enabled = false;
    });
    vi.mocked(loadRouteContentForEditing).mockReset();
    mocks.loadModel.mockReset();
    mocks.loadOrCreateModel.mockReset();
    mocks.rendererMobileStates = [];
    mocks.rendererProps = undefined;
    mocks.model = undefined;
    mocks.viewFilterByTk = undefined;
    mocks.viewInputMobileLayout = true;
    mocks.viewSourceId = undefined;
    mocks.contextMobileLayout = undefined;
  });

  it('keeps the mounted route page and confirms storage only on the first edit', async () => {
    mocks.model = createPageModel();
    const { queryByTestId } = render(<FlowPage parentId="route" />);
    await waitFor(() => expect(queryByTestId('flow-model-renderer')).toBeTruthy());
    expect(mocks.loadOrCreateModel).toHaveBeenCalledWith(expect.objectContaining({ parentId: 'route' }), {
      skipSave: true,
    });
    expect(loadRouteContentForEditing).not.toHaveBeenCalled();

    const input = queryByTestId('flow-model-renderer') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'draft' } });
    let finish: () => void;
    vi.mocked(loadRouteContentForEditing).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(mocks.model as unknown as Awaited<ReturnType<typeof loadRouteContentForEditing>>);
        }),
    );
    act(() => {
      editor.enabled = true;
    });
    await waitFor(() => expect(loadRouteContentForEditing).toHaveBeenCalledOnce());
    expect(input.closest('[inert]')).toBeTruthy();
    expect(queryByTestId('flow-model-renderer')).toBe(input);
    await act(async () => finish());
    await waitFor(() => expect(input.closest('[inert]')).toBeNull());
    act(() => {
      editor.enabled = false;
    });
    act(() => {
      editor.enabled = true;
    });
    expect(queryByTestId('flow-model-renderer')).toBe(input);
    expect(input.value).toBe('draft');
    expect(loadRouteContentForEditing).toHaveBeenCalledOnce();
    expect(mocks.loadOrCreateModel).toHaveBeenCalledOnce();
  });

  it('opens directly in the editor and keeps the confirmed page on subsequent toggles', async () => {
    editor.enabled = true;
    mocks.model = createPageModel();
    vi.mocked(loadRouteContentForEditing).mockResolvedValue(
      mocks.model as unknown as Awaited<ReturnType<typeof loadRouteContentForEditing>>,
    );
    const { findByTestId, getByTestId } = render(<FlowPage parentId="route" />);
    const input = await findByTestId('flow-model-renderer');
    act(() => {
      editor.enabled = false;
    });
    act(() => {
      editor.enabled = true;
    });
    expect(getByTestId('flow-model-renderer')).toBe(input);
    expect(loadRouteContentForEditing).toHaveBeenCalledOnce();
    expect(mocks.loadOrCreateModel).not.toHaveBeenCalled();
  });

  it('uses showFlowSettings from page model props', async () => {
    mocks.model = createPageModel();
    render(<FlowPage />);

    await waitFor(() => {
      expect((mocks.rendererProps as { showFlowSettings?: boolean } | undefined)?.showFlowSettings).toBe(false);
    });
  });

  it('exposes mobile layout state from route-managed view inputArgs before first render', async () => {
    mocks.model = createPageModel();
    render(<FlowPage onModelLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.rendererMobileStates.length).toBeGreaterThan(0);
    });
    expect(mocks.rendererMobileStates[0]).toBe(true);
  });

  it.each([
    { viewInputMobileLayout: true, contextMobileLayout: false, expected: false },
    { viewInputMobileLayout: false, contextMobileLayout: true, expected: true },
    { viewInputMobileLayout: undefined, contextMobileLayout: true, expected: true },
    { viewInputMobileLayout: undefined, contextMobileLayout: false, expected: false },
    { viewInputMobileLayout: true, contextMobileLayout: undefined, expected: true },
    { viewInputMobileLayout: false, contextMobileLayout: undefined, expected: false },
  ])(
    'resolves mobile layout state from view input args and layout context %#',
    async ({ viewInputMobileLayout, contextMobileLayout, expected }) => {
      mocks.viewInputMobileLayout = viewInputMobileLayout;
      mocks.contextMobileLayout = contextMobileLayout;
      mocks.model = createPageModel();

      render(<FlowPage onModelLoaded={vi.fn()} />);

      await waitFor(() => {
        expect(mocks.rendererMobileStates.length).toBeGreaterThan(0);
      });
      expect(mocks.rendererMobileStates[0]).toBe(expected);
    },
  );

  it('reloads runtime page models for record scoped views', async () => {
    mocks.model = createPageModel();
    mocks.viewFilterByTk = 1;
    mocks.loadModel.mockImplementation(async () => mocks.model);

    render(<FlowPage onModelLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.loadModel).toHaveBeenCalled();
    });
    expect(mocks.loadModel.mock.calls[0]?.[0]).toMatchObject({ refresh: true });
    expect(mocks.loadOrCreateModel).not.toHaveBeenCalled();
  });

  it('keeps configured page model cache behavior in flow settings mode', async () => {
    editor.enabled = true;
    mocks.model = createPageModel();
    mocks.viewFilterByTk = 1;

    render(<FlowPage onModelLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.loadOrCreateModel).toHaveBeenCalled();
    });
    expect(mocks.loadModel).not.toHaveBeenCalled();
  });
});
