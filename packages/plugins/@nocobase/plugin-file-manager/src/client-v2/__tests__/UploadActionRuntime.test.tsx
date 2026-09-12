/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  UploadActionModel,
  useBeforeUpload,
  useStorage,
  useStorageCfg,
  useStorageUploadProps,
} from '../models/UploadActionModel';

const runtimeMocks = vi.hoisted(() => ({
  context: {
    api: {
      axios: {
        post: vi.fn(),
      },
      request: vi.fn(),
    },
    app: {
      pm: {
        get: vi.fn(),
      },
    },
    collection: {
      dataSourceKey: 'analytics',
    },
    collectionField: {
      storage: 'local',
      targetCollection: {
        storage: 'target-storage',
      },
    },
    t: (value: string) => value,
    view: {
      Header: ({ title }: { title: string }) => <h1>{title}</h1>,
      close: vi.fn(),
      inputArgs: {
        sourceId: 10,
      },
    },
  },
  registerFlow: vi.fn(),
  requestRun: vi.fn(),
  storage: {
    id: 1,
    rules: {
      mimetype: 'image/*',
      size: 100,
    },
    type: 'local',
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  ActionModel: class ActionModel {
    static define = vi.fn();
    static registerFlow = runtimeMocks.registerFlow;
    props: Record<string, unknown> = {};
    dispatchEvent = vi.fn();
    setProps(nextProps: Record<string, unknown>) {
      this.props = { ...this.props, ...nextProps };
    }
    onInit() {}
  },
  ActionSceneEnum: {
    collection: 'collection',
  },
  Icon: ({ type }: { type: string }) => <span>{type}</span>,
}));

vi.mock('@nocobase/flow-engine', () => ({
  escapeT: (value: string) => value,
  useFlowContext: () => runtimeMocks.context,
}));

vi.mock('ahooks', () => ({
  useRequest: () => ({
    data: {
      data: runtimeMocks.storage,
    },
    loading: false,
    run: runtimeMocks.requestRun,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en-US',
    },
    t: (value: string, params?: Record<string, string>) => value.replace('{{size}}', params?.size || ''),
  }),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Upload: {
      Dragger: ({ beforeUpload, children }: React.PropsWithChildren<{ beforeUpload: (file: File) => unknown }>) => (
        <div>
          <button
            type="button"
            onClick={() => beforeUpload(new File(['content'], 'avatar.png', { type: 'image/png' }))}
          >
            before upload
          </button>
          {children}
        </div>
      ),
    },
  };
});

describe('UploadActionModel runtime hooks', () => {
  afterEach(() => {
    cleanup();
  });

  it('loads storage configuration for the current data source', () => {
    const { result } = renderHook(() => useStorage('local', 'analytics'));

    expect(result.current).toBe(runtimeMocks.storage);
  });

  it('combines storage configuration with storage-specific upload props', () => {
    const useUploadProps = vi.fn(() => ({
      headers: {
        Authorization: 'Bearer token',
      },
      method: 'put',
    }));
    runtimeMocks.context.app.pm.get.mockReturnValue({
      getStorageType: () => ({
        useUploadProps,
      }),
    });
    const model = {
      context: {
        blockModel: {
          collection: {
            dataSourceKey: 'analytics',
            storage: 'collection-storage',
          },
        },
        collection: {
          dataSourceKey: 'analytics',
        },
      },
    };

    const { result: cfg } = renderHook(() => useStorageCfg(model));
    expect(cfg.current.storage).toBe(runtimeMocks.storage);
    expect(cfg.current.storageType).toEqual({ useUploadProps });

    const { result } = renderHook(() => useStorageUploadProps({ action: 'files:create' }, model));
    expect(result.current).toMatchObject({
      action: 'files:create?uploadDataSourceKey=analytics',
      headers: {
        Authorization: 'Bearer token',
      },
      method: 'put',
      rules: runtimeMocks.storage.rules,
    });
    expect(useUploadProps).toHaveBeenCalledWith(
      expect.objectContaining({
        rules: runtimeMocks.storage.rules,
        storage: runtimeMocks.storage,
      }),
    );
  });

  it('marks invalid files and clears previous upload errors when rules pass', async () => {
    const { result, rerender } = renderHook(({ rules }) => useBeforeUpload(rules), {
      initialProps: {
        rules: {
          mimetype: 'application/pdf',
          size: 50,
        },
      },
    });
    const file = new File(['content'], 'avatar.png', { type: 'image/png' }) as File & {
      response?: string;
      status?: string;
    };

    expect(result.current(file, [])).toBe(false);
    expect(file.status).toBe('error');
    expect(file.response).toBe('File type is not allowed');

    rerender({ rules: { mimetype: 'image/*', size: 100 } });
    await expect(result.current(file, [])).resolves.toBe(file);
    expect(file.status).toBeUndefined();
    expect(file.response).toBeUndefined();
  });

  it('renders upload popup content from the registered open-view flow', () => {
    const flow = runtimeMocks.registerFlow.mock.calls[0][0];
    const open = vi.fn();
    const contentElement = document.createElement('div');
    const model = {
      context: {
        blockModel: {
          collection: {
            name: 'attachments',
            storage: 'collection-storage',
          },
          resource: {
            refresh: vi.fn(),
          },
        },
        collection: {
          name: 'attachments',
        },
      },
      flowEngine: {
        context: {
          themeToken: {
            colorBgLayout: '#f7f7f7',
          },
        },
      },
    };

    flow.steps.openView.handler(
      {
        inputArgs: {},
        layoutContentElement: contentElement,
        model,
        resource: {
          getSourceId: () => 10,
        },
        viewer: { open },
      },
      { mode: 'drawer', size: 'medium' },
    );

    const openOptions = open.mock.calls[0][0];
    render(openOptions.content());

    expect(screen.getByText('Upload file')).toBeInTheDocument();
    expect(screen.getByText('Click or drag file to this area to upload')).toBeInTheDocument();
    expect(screen.getByText('File size should not exceed 100 B.')).toBeInTheDocument();
  });
});
