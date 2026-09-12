/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImportActionModel } from '../ImportActionModel';
import { PluginActionImportClient } from '../index';

const fileSaverMocks = vi.hoisted(() => ({
  saveAs: vi.fn(),
}));
const antdMocks = vi.hoisted(() => ({
  uploadFileList: [] as UploadFileLike[],
  draggerProps: [] as UploadDraggerProps[],
}));

vi.mock('file-saver', () => ({
  saveAs: fileSaverMocks.saveAs,
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    Upload: {
      ...actual.Upload,
      Dragger: (props: UploadDraggerProps) => {
        antdMocks.draggerProps.push(props);
        return ReactModule.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'import-upload-dragger',
            onClick: () => props.onChange?.({ fileList: antdMocks.uploadFileList }),
          },
          props.children,
        );
      },
    },
  };
});

type ImportColumn = {
  dataIndex: string[];
  title?: string;
  description?: string;
  defaultTitle?: string;
};

type UploadFileLike = {
  name?: string;
  type?: string;
  originFileObj?: File;
};

type UploadDraggerProps = {
  children?: React.ReactNode;
  beforeUpload?: () => boolean;
  onChange?: (info: { fileList: UploadFileLike[] }) => void;
};

type ImportHandlerContext = ReturnType<typeof createImportContext>;

function createField(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    interface: 'input',
    uiSchema: {
      title: name,
    },
    ...overrides,
  };
}

function createModel(uid: string) {
  const engine = new FlowEngine();
  engine.registerModels({ ImportActionModel });
  return engine.createModel<ImportActionModel>({
    use: 'ImportActionModel',
    uid,
  });
}

function createImportContext(
  options: {
    importColumns?: ImportColumn[] | null;
    explain?: string;
    importMode?: string;
    importXlsx?: ReturnType<typeof vi.fn>;
    runAction?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const runAction = options.runAction ?? vi.fn().mockResolvedValue('template-data');
  const refresh = vi.fn().mockResolvedValue(undefined);
  const importXlsx = options.importXlsx ?? vi.fn().mockResolvedValue({ data: { data: { successCount: 2 } } });
  const viewerOpen = vi.fn().mockResolvedValue(undefined);
  const collectionFields = [
    createField('status', { uiSchema: { title: 'Status' } }),
    createField('author', {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      uiSchema: { title: 'Author' },
      targetCollection: {
        getFields: () => [createField('nickname', { uiSchema: { title: 'Nickname' } })],
      },
    }),
    createField('createdAt', { interface: 'createdAt' }),
  ];
  const fieldsByPath = new Map<string, ReturnType<typeof createField>>([
    ['main.posts.status', createField('status', { uiSchema: { title: 'Status' } })],
    ['main.posts.author', createField('author', { uiSchema: { title: 'Author' } })],
    ['main.posts.author.nickname', createField('nickname', { uiSchema: { title: 'Nickname' } })],
  ]);
  const resource = {
    runAction,
    refresh,
    getResourceName: vi.fn(() => 'posts'),
    getSourceId: vi.fn(() => 'source-1'),
    getDataSourceKey: vi.fn(() => 'main'),
  };
  const blockModel = {
    collection: {
      title: 'Posts',
      name: 'posts',
      dataSourceKey: 'main',
      getFields: () => collectionFields,
    },
    resource,
  };
  const context = {
    blockModel,
    collection: {
      dataSourceKey: 'main',
    },
    dataSourceManager: {
      getCollectionField: vi.fn((path: string) => fieldsByPath.get(path)),
    },
  };
  const t = (key: string, values?: { successCount?: number }) => {
    if (typeof values?.successCount === 'number') {
      return key.replace('{{successCount}}', String(values.successCount));
    }
    return key;
  };

  return {
    model: {
      context,
      getProps: () => ({
        importSettings: {
          explain: options.explain ?? 'explain text',
          importColumns:
            options.importColumns === undefined
              ? [
                  { dataIndex: ['status'] },
                  { dataIndex: ['author', 'nickname'], title: 'Author nickname' },
                  { dataIndex: ['missing'] },
                ]
              : options.importColumns,
        },
        importMode: options.importMode ?? 'overwrite',
      }),
    },
    api: {
      resource: vi.fn(() => ({
        importXlsx,
      })),
    },
    viewer: {
      open: viewerOpen,
    },
    t,
    resource,
    importXlsx,
    viewerOpen,
    blockModel,
  };
}

async function openImportDialog(ctx: ImportHandlerContext) {
  const model = createModel('import-action-dialog');
  const step = model.getFlow('importSettings')?.getStep('import')?.serialize() as
    | { handler?: (ctx: ImportHandlerContext) => Promise<void> }
    | undefined;
  expect(step?.handler).toBeTypeOf('function');

  await step?.handler?.(ctx);

  const dialogConfig = ctx.viewerOpen.mock.calls[0][0] as {
    title: string;
    width: number;
    content: (popover: { close: ReturnType<typeof vi.fn> }) => React.ReactElement;
  };
  const popover = {
    close: vi.fn(),
  };
  render(dialogConfig.content(popover));
  return {
    dialogConfig,
    popover,
  };
}

function setUploadFiles(fileList: UploadFileLike[]) {
  antdMocks.uploadFileList = fileList;
  fireEvent.click(screen.getByTestId('import-upload-dragger'));
}

function getLatestUploadDraggerProps() {
  const props = antdMocks.draggerProps.at(-1);
  expect(props).toBeDefined();
  return props as UploadDraggerProps;
}

describe('ImportActionModel', () => {
  afterEach(() => {
    vi.clearAllMocks();
    antdMocks.uploadFileList = [];
    antdMocks.draggerProps = [];
  });

  it('registers the import action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionImportClient.prototype) as PluginActionImportClient & {
      app: {
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(registerModelLoaders).toHaveBeenCalledWith({
      ImportActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.ImportActionModel.loader()).resolves.toHaveProperty('ImportActionModel', ImportActionModel);
  });

  it('builds import setting schema, defaults, and stored columns', () => {
    const model = createModel('import-action-settings');
    const step = model.getFlow('importActionSetting')?.getStep('importSetting')?.serialize() as
      | {
          uiSchema?: (ctx: ImportHandlerContext) => Record<string, unknown>;
          defaultParams?: (ctx: ImportHandlerContext) => Record<string, unknown>;
          handler?: (ctx: { model: { setProps: ReturnType<typeof vi.fn> } }, params: Record<string, unknown>) => void;
        }
      | undefined;
    const ctx = createImportContext();
    const schema = step?.uiSchema?.(ctx);
    const setProps = vi.fn();
    const dataIndexSchema = schema?.importColumns?.items?.properties?.space?.properties?.dataIndex as {
      'x-component-props'?: {
        fieldNames?: Record<string, string>;
        options?: unknown[];
      };
    };

    step?.handler?.(
      {
        model: {
          setProps,
        },
      },
      {
        explain: 'explain',
        importColumns: [
          {
            dataIndex: [{ name: 'author' }, 'nickname'],
            title: 'Author nickname',
            description: 'Author display name',
          },
          {
            dataIndex: [],
            title: 'Ignored',
          },
        ],
      },
    );

    expect(dataIndexSchema['x-component-props']).toMatchObject({
      fieldNames: {
        label: 'title',
        value: 'name',
        children: 'children',
      },
      options: expect.arrayContaining([
        expect.objectContaining({
          name: 'status',
          title: 'Status',
        }),
      ]),
    });
    expect(step?.defaultParams?.(ctx)).toEqual({
      importColumns: [{ dataIndex: ['status'] }, { dataIndex: ['author'] }, { dataIndex: ['createdAt'] }],
      explain: '',
    });
    expect(setProps).toHaveBeenCalledWith('importSettings', {
      importColumns: [
        {
          dataIndex: ['author', 'nickname'],
          title: 'Author nickname',
          description: 'Author display name',
        },
      ],
      explain: 'explain',
    });
  });

  it('opens the import dialog and downloads the xlsx template', async () => {
    const ctx = createImportContext();
    const { dialogConfig } = await openImportDialog(ctx);

    expect(ctx.viewerOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialog',
        placement: 'center',
        width: 800,
        title: 'Import Data',
      }),
    );
    expect(dialogConfig.width).toBe(800);

    fireEvent.click(screen.getByRole('button', { name: 'Download template' }));

    await waitFor(() => {
      expect(ctx.resource.runAction).toHaveBeenCalledWith('downloadXlsxTemplate', {
        data: {
          title: 'Posts',
          explain: 'explain text',
          columns: [
            {
              dataIndex: ['status'],
              defaultTitle: 'Status',
            },
            {
              dataIndex: ['author', 'nickname'],
              title: 'Author nickname',
              defaultTitle: 'Author/Nickname',
            },
          ],
        },
        responseType: 'blob',
        method: 'post',
      });
    });
    expect(fileSaverMocks.saveAs).toHaveBeenCalledWith(expect.any(Blob), 'Posts.xlsx');
  });

  it('skips import columns when nested fields are missing', async () => {
    const ctx = createImportContext({
      importColumns: [{ dataIndex: ['status'] }, { dataIndex: ['author', 'missingNickname'] }],
    });
    await openImportDialog(ctx);

    fireEvent.click(screen.getByRole('button', { name: 'Download template' }));

    await waitFor(() => {
      expect(ctx.resource.runAction).toHaveBeenCalledWith(
        'downloadXlsxTemplate',
        expect.objectContaining({
          data: expect.objectContaining({
            columns: [
              {
                dataIndex: ['status'],
                defaultTitle: 'Status',
              },
            ],
          }),
        }),
      );
    });
  });

  it('downloads the template without columns when import columns are not configured', async () => {
    const ctx = createImportContext({
      importColumns: null,
    });
    await openImportDialog(ctx);

    fireEvent.click(screen.getByRole('button', { name: 'Download template' }));

    await waitFor(() => {
      expect(ctx.resource.runAction).toHaveBeenCalledWith(
        'downloadXlsxTemplate',
        expect.objectContaining({
          data: expect.objectContaining({
            columns: [],
          }),
        }),
      );
    });
  });

  it('keeps import disabled when no file is selected', async () => {
    const ctx = createImportContext();
    await openImportDialog(ctx);

    setUploadFiles([]);
    expect(screen.getByRole('button', { name: 'Start import' })).toBeDisabled();
  });

  it('validates uploaded files and imports valid excel data', async () => {
    const ctx = createImportContext({
      importXlsx: vi.fn().mockResolvedValue({
        data: {
          data: {
            successCount: 2,
            data: [1, 2],
          },
          meta: {
            failureCount: 1,
          },
        },
      }),
    });
    const { popover } = await openImportDialog(ctx);

    expect(getLatestUploadDraggerProps().beforeUpload?.()).toBe(false);
    setUploadFiles([{ name: 'plain.txt', type: 'text/plain' }]);
    expect(await screen.findByText('Please upload the file of Excel')).toBeTruthy();

    setUploadFiles([
      {
        name: 'valid.xlsx',
        originFileObj: new File(['xlsx'], 'valid.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      },
    ]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start import' })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start import' }));

    await waitFor(() => {
      expect(ctx.api.resource).toHaveBeenCalledWith('posts', 'source-1', { 'X-Data-Source': 'main' });
      expect(ctx.importXlsx).toHaveBeenCalledWith(
        {
          values: expect.any(FormData),
          mode: 'overwrite',
          timeout: 10 * 60 * 1000,
        },
        {
          skipNotify: true,
        },
      );
      expect(ctx.resource.refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText('2 records have been successfully imported')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'To download the failure data' }));
    expect(fileSaverMocks.saveAs).toHaveBeenLastCalledWith(expect.any(Blob), 'fail.xlsx');

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(popover.close).toHaveBeenCalled();
  });

  it('removes an uploaded file and cancels the dialog', async () => {
    const ctx = createImportContext();
    const { popover } = await openImportDialog(ctx);

    setUploadFiles([
      {
        name: 'valid.xlsx',
        originFileObj: new File(['xlsx'], 'valid.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      },
    ]);
    expect(await screen.findByText('valid.xlsx')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() => {
      expect(screen.queryByText('valid.xlsx')).toBeNull();
      expect(screen.getByRole('button', { name: 'Start import' })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(popover.close).toHaveBeenCalled();
  });

  it('closes the dialog when import runs as an async task', async () => {
    const ctx = createImportContext({
      importXlsx: vi.fn().mockResolvedValue({
        data: {
          data: {
            taskId: 'task-1',
          },
        },
      }),
    });
    const { popover } = await openImportDialog(ctx);

    setUploadFiles([
      {
        name: 'valid.xlsx',
        originFileObj: new File(['xlsx'], 'valid.xlsx', {
          type: 'application/vnd.ms-excel',
        }),
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Start import' }));

    await waitFor(() => {
      expect(popover.close).toHaveBeenCalled();
    });
    expect(ctx.resource.refresh).not.toHaveBeenCalled();
  });

  it('shows import errors and returns to the import form', async () => {
    const ctx = createImportContext({
      importXlsx: vi.fn().mockRejectedValue({
        response: {
          data: {
            errors: ['<p>Row 1 failed</p>', { message: 'Row 2 failed' }],
          },
        },
      }),
    });
    await openImportDialog(ctx);

    setUploadFiles([
      {
        name: 'valid.xlsx',
        originFileObj: new File(['xlsx'], 'valid.xlsx', {
          type: 'application/wps-office.xlsx',
        }),
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Start import' }));

    expect(await screen.findByText('Import failed')).toBeTruthy();
    expect(screen.getByText(/Row 1 failed/)).toBeTruthy();
    expect(screen.getByText(/Row 2 failed/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Step 1: Download template')).toBeTruthy();
  });

  it('uses fallback import error messages', async () => {
    const ctx = createImportContext({
      importXlsx: vi.fn().mockRejectedValue({
        data: {
          error: {
            message: 'Fallback data error',
          },
        },
      }),
    });
    await openImportDialog(ctx);

    setUploadFiles([
      {
        name: 'valid.xlsx',
        originFileObj: new File(['xlsx'], 'valid.xlsx', {
          type: 'application/vnd.ms-excel',
        }),
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Start import' }));

    expect(await screen.findByText('Fallback data error')).toBeTruthy();

    const messageCtx = createImportContext({
      importXlsx: vi.fn().mockRejectedValue(new Error('Plain error message')),
    });
    await openImportDialog(messageCtx);
    setUploadFiles([
      {
        name: 'valid.xlsx',
        originFileObj: new File(['xlsx'], 'valid.xlsx', {
          type: 'application/vnd.ms-excel',
        }),
      },
    ]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Start import' }).at(-1) as HTMLElement);

    expect(await screen.findByText('Plain error message')).toBeTruthy();

    const defaultMessageCtx = createImportContext({
      importXlsx: vi.fn().mockRejectedValue({
        response: {
          data: {
            messages: [],
          },
        },
      }),
    });
    await openImportDialog(defaultMessageCtx);
    setUploadFiles([
      {
        name: 'valid.xlsx',
        originFileObj: new File(['xlsx'], 'valid.xlsx', {
          type: 'application/vnd.ms-excel',
        }),
      },
    ]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Start import' }).at(-1) as HTMLElement);

    expect(await screen.findAllByText('Import failed')).not.toHaveLength(0);
  });
});
