/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@nocobase/test/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicFormPage } from '../components/PublicFormPage';

type MockFlowContext = {
  defineProperty: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => {
  const requestInterceptorUse = vi.fn(() => 1);
  const requestInterceptorEject = vi.fn();

  return {
    device: {
      isDesktop: false,
      isMobile: true,
    },
    requestInterceptorEject,
    requestInterceptorUse,
    flowEngine: {
      createModelAsync: vi.fn(),
      getModel: vi.fn(),
      modelRepository: {},
      resolveModelTree: vi.fn(),
      setModelRepository: vi.fn(),
      context: {
        dataSourceManager: {
          collectionFieldInterfaceManager: {},
          requester: {},
        },
      },
    },
    flowModelRendererModel: null as { uid?: string } | null,
    flowViewContext: null as MockFlowContext | null,
    publicFormFlowModelRepository: vi.fn(),
    useRequest: vi.fn(() => ({
      data: {
        data: {
          dataSource: { key: 'main' },
          schema: {},
          title: 'Public form',
          token: 'form-token',
        },
      },
      error: null,
      loading: false,
      run: vi.fn(),
    })),
  };
});

vi.mock('react-device-detect', async () => ({
  ...(await vi.importActual('react-device-detect')),
  get isDesktop() {
    return mocks.device.isDesktop;
  },
  get isMobile() {
    return mocks.device.isMobile;
  },
}));

vi.mock('react-router', () => ({
  useParams: () => ({ name: 'public-form-1' }),
}));

vi.mock('@formily/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@formily/react')>();

  return {
    ...actual,
    useField: () => ({
      form: {
        query: () => ({
          take: vi.fn(),
        }),
      },
    }),
  };
});

vi.mock('../components/components/MobileDatePicker', () => ({
  MobileDateTimePicker: () => <div data-testid="mobile-date-time-picker" />,
}));

vi.mock('../components/components/MobilePicker', () => ({
  MobilePicker: () => <div data-testid="mobile-picker" />,
}));

vi.mock('../hooks', () => ({
  usePublicSubmitActionProps: vi.fn(),
}));

vi.mock('../locale', () => ({
  usePublicFormTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();

  class FlowContext {
    addDelegate = vi.fn();
    defineMethod = vi.fn();
    defineProperty = vi.fn();
    removeDelegate = vi.fn();
  }

  class DataSourceManager {
    setCollectionFieldInterfaceManager = vi.fn();
    setFlowEngine = vi.fn();
    setRequester = vi.fn();
    upsertDataSource = vi.fn();
    getDataSource = vi.fn(() => ({
      setCollections: vi.fn(),
    }));
  }

  return {
    ...actual,
    DataSourceManager,
    FlowContext,
    FlowModelRenderer: ({ model }: { model?: { uid?: string } }) => {
      mocks.flowModelRendererModel = model || null;
      return <div data-testid="public-form-flow-model">{model?.uid}</div>;
    },
    FlowViewContextProvider: ({ children, context }: React.PropsWithChildren<{ context?: MockFlowContext }>) => {
      mocks.flowViewContext = context || null;
      return <>{children}</>;
    },
    useFlowEngine: () => mocks.flowEngine,
  };
});

vi.mock('../../client-v2/publicFormFlowModelRepository', () => ({
  PublicFormFlowModelRepository: mocks.publicFormFlowModelRepository,
  isPublicFormFlowModelRepository: () => false,
}));

vi.mock('@nocobase/client', () => {
  const SchemaComponentContext = React.createContext({});
  const AssociationField = Object.assign(() => <div data-testid="association-field" />, {
    AddNewer: () => null,
    FileSelector: () => null,
    InternalSelect: () => null,
    Nester: () => null,
    ReadPretty: () => null,
    Selector: () => null,
    SubTable: () => null,
    Viewer: () => null,
  });
  const DatePicker = Object.assign(() => <div data-testid="date-picker" />, {
    FilterWithPicker: () => null,
    RangePicker: () => null,
  });

  return {
    ACLCustomContext: React.createContext({}),
    Action: { Container: ({ children }: React.PropsWithChildren) => <>{children}</> },
    APIClientProvider: ({ children }: React.PropsWithChildren<{ apiClient?: unknown }>) => <>{children}</>,
    AssociationField,
    CollectionManager: class CollectionManager {},
    DataSource: class DataSource {},
    DataSourceApplicationProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
    DataSourceManager: class DataSourceManager {
      addDataSource() {
        return {};
      }
    },
    DatePicker,
    GlobalThemeProvider: ({ children }: React.PropsWithChildren<{ theme?: unknown }>) => <>{children}</>,
    PoweredBy: () => <div>Powered by NocoBase</div>,
    SchemaComponent: () => (
      <div data-testid="public-form-schema" style={{ height: 2000 }}>
        Public form content
      </div>
    ),
    SchemaComponentContext,
    VariablesProvider: ({ children }: React.PropsWithChildren<{ filterVariables?: unknown }>) => <>{children}</>,
    useApp: () => ({
      apiClient: {
        axios: {
          interceptors: {
            request: {
              eject: mocks.requestInterceptorEject,
              use: mocks.requestInterceptorUse,
            },
          },
        },
      },
    }),
    useCompile: () => (value: string) => value,
    useRequest: mocks.useRequest,
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();

  return {
    ...actual,
    Input: {
      ...actual.Input,
      Password: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} type="password" />,
    },
    Modal: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    Spin: () => <div>Loading</div>,
  };
});

vi.mock('antd-mobile', () => ({
  Button: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('PublicFormPage', () => {
  const findPublicFormContainer = () =>
    Array.from(document.querySelectorAll('div')).find(
      (element) =>
        (element.style.overflowY === 'auto' || element.style.overflow === 'auto') &&
        element.textContent?.includes('Public form content'),
    ) as HTMLDivElement | undefined;

  beforeEach(() => {
    mocks.device.isDesktop = false;
    mocks.device.isMobile = true;
    mocks.flowEngine.createModelAsync.mockReset();
    mocks.flowEngine.createModelAsync.mockResolvedValue({
      subModels: {
        page: {
          context: {
            addDelegate: vi.fn(),
            removeDelegate: vi.fn(),
          },
          setProps: vi.fn(),
          uid: 'public-form-page-model',
        },
      },
      uid: 'public-form-1',
    });
    mocks.flowEngine.getModel.mockReset();
    mocks.flowEngine.getModel.mockReturnValue(null);
    mocks.flowEngine.resolveModelTree.mockReset();
    mocks.flowEngine.setModelRepository.mockReset();
    mocks.flowModelRendererModel = null;
    mocks.flowViewContext = null;
    mocks.publicFormFlowModelRepository.mockClear();
    mocks.useRequest.mockClear();
    mocks.useRequest.mockReturnValue({
      data: {
        data: {
          dataSource: { key: 'main' },
          schema: {},
          title: 'Public form',
          token: 'form-token',
        },
      },
      error: null,
      loading: false,
      run: vi.fn(),
    });
    vi.stubGlobal('CSS', {
      supports: vi.fn(() => true),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    document.body.style.backgroundColor = '';
    document.body.style.overflow = '';
  });

  it('uses the viewport height as the mobile public form scroll container height', async () => {
    render(<PublicFormPage />);

    expect(await screen.findByTestId('public-form-schema')).toBeInTheDocument();
    const publicFormContainer = findPublicFormContainer();

    expect(publicFormContainer).toBeDefined();
    expect(publicFormContainer?.style.minHeight).toBe('100dvh');
    expect(publicFormContainer?.style.overflowY).toBe('auto');
    expect(publicFormContainer?.style.WebkitOverflowScrolling).toBe('touch');
  });

  it('falls back to the viewport height supported by jsdom when dvh is unavailable', async () => {
    vi.stubGlobal('CSS', {
      supports: vi.fn(() => false),
    });

    render(<PublicFormPage />);

    expect(await screen.findByTestId('public-form-schema')).toBeInTheDocument();
    const publicFormContainer = findPublicFormContainer();

    expect(publicFormContainer).toBeDefined();
    expect(publicFormContainer?.style.minHeight).toBe('100vh');
    expect(publicFormContainer?.style.height).toBe('100vh');
    expect(publicFormContainer?.style.overflowY).toBe('auto');
  });

  it('keeps the desktop public form overflow behavior unchanged', async () => {
    mocks.device.isDesktop = true;
    mocks.device.isMobile = false;

    render(<PublicFormPage />);

    expect(await screen.findByTestId('public-form-schema')).toBeInTheDocument();
    const publicFormContainer = findPublicFormContainer();

    expect(publicFormContainer).toBeDefined();
    expect(publicFormContainer?.style.height).toBe('100%');
    expect(publicFormContainer?.style.overflow).toBe('auto');
    expect(publicFormContainer?.style.overflowX).toBe('');
  });

  it('renders the v2 FlowModel runtime when public form meta contains a flowModel', async () => {
    mocks.useRequest.mockReturnValue({
      data: {
        data: {
          dataSource: { key: 'main', collections: [] },
          flowModel: {
            uid: 'public-form-1',
            subModels: {
              page: {
                uid: 'public-form-page-model',
              },
            },
          },
          title: 'V2 public form',
          token: 'form-token',
        },
      },
      error: null,
      loading: false,
      run: vi.fn(),
    });

    render(<PublicFormPage />);

    expect(await screen.findByTestId('public-form-flow-model')).toHaveTextContent('public-form-page-model');
    expect(screen.queryByTestId('public-form-schema')).toBeNull();
    expect(mocks.flowEngine.resolveModelTree).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'public-form-1',
      }),
    );
    expect(mocks.flowEngine.createModelAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'public-form-1',
      }),
      {
        delegate: mocks.flowViewContext,
      },
    );
    expect(mocks.flowViewContext?.defineProperty).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        value: expect.objectContaining({
          type: 'embed',
        }),
      }),
    );
    expect(mocks.flowViewContext?.defineProperty).toHaveBeenCalledWith(
      'dataSourceManager',
      expect.objectContaining({
        get: expect.any(Function),
        cache: false,
      }),
    );
  });

  it('renders the public form password error inline', async () => {
    mocks.useRequest.mockReturnValue({
      data: null,
      error: {
        response: {
          status: 401,
        },
      },
      loading: false,
      run: vi.fn(),
    });

    render(<PublicFormPage />);

    expect(await screen.findByText('Incorrect password')).toBeInTheDocument();
  });
});
