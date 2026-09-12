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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowPage } from '../FlowPage';

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
  flowSettingsEnabled: false,
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
      return ReactModule.createElement('div', { 'data-testid': 'flow-model-renderer' });
    }),
    useFlowEngine: vi.fn(() => ({
      getModelClassAsync: vi.fn(async () => TestPageModelClass),
      loadModel: mocks.loadModel,
      loadOrCreateModel: mocks.loadOrCreateModel,
      context: {
        flowSettingsEnabled: mocks.flowSettingsEnabled,
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

vi.mock('ahooks', async () => {
  const actual = await vi.importActual<typeof import('ahooks')>('ahooks');
  const ReactModule = await import('react');
  return {
    ...actual,
    useRequest: vi.fn((service: () => Promise<unknown>) => {
      const serviceRef = ReactModule.useRef(service);
      const [state, setState] = ReactModule.useState<{
        loading: boolean;
        data?: unknown;
        error?: unknown;
      }>({
        loading: true,
      });

      ReactModule.useEffect(() => {
        let active = true;
        serviceRef
          .current()
          .then((data) => {
            if (active) {
              setState({ loading: false, data, error: null });
            }
          })
          .catch((error) => {
            if (active) {
              setState({ loading: false, data: undefined, error });
            }
          });

        return () => {
          active = false;
        };
      }, []);

      return state;
    }),
  };
});

describe('FlowPage', () => {
  beforeEach(() => {
    mocks.loadModel.mockImplementation(async () => null);
    mocks.loadOrCreateModel.mockImplementation(async () => mocks.model);
  });

  afterEach(() => {
    mocks.flowSettingsEnabled = false;
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
    mocks.flowSettingsEnabled = true;
    mocks.model = createPageModel();
    mocks.viewFilterByTk = 1;

    render(<FlowPage onModelLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.loadOrCreateModel).toHaveBeenCalled();
    });
    expect(mocks.loadModel).not.toHaveBeenCalled();
  });
});
