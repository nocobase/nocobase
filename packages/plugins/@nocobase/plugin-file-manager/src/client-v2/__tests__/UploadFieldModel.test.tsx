/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardUpload, UploadFieldModel } from '../models/UploadFieldModel';

const fieldModelMocks = vi.hoisted(() => ({
  bindModelToInterface: vi.fn(),
  define: vi.fn(),
  registerFlow: vi.fn(),
}));

vi.mock('@formily/react', () => ({
  FieldContext: {
    Provider: ({ children }: React.PropsWithChildren) => <>{children}</>,
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  FieldModel: class FieldModel {
    props: Record<string, unknown> = {};
    context: Record<string, unknown> = {};
    static define = fieldModelMocks.define;
    static registerFlow = fieldModelMocks.registerFlow;
    dispatchEvent = vi.fn();
    setProps(keyOrProps: string | Record<string, unknown>, value?: unknown) {
      this.props =
        typeof keyOrProps === 'string' ? { ...this.props, [keyOrProps]: value } : { ...this.props, ...keyOrProps };
    }
    onInit() {}
  },
  RecordPickerContent: () => <div>record picker</div>,
}));

vi.mock('@nocobase/flow-engine', () => ({
  EditableItemModel: {
    bindModelToInterface: fieldModelMocks.bindModelToInterface,
  },
  largeField: () => (target: unknown) => target,
  observable: {
    ref: (value: unknown) => ({ value }),
  },
  tExpr: (value: string) => value,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (value: string) => value,
  }),
}));

vi.mock('../previewer/filePreviewTypes', () => ({
  FilePreviewRenderer: ({
    file,
    onDownload,
    onSwitchIndex,
  }: {
    file: { filename?: string };
    onDownload?: (file?: { filename?: string }) => void;
    onSwitchIndex?: (index: number) => void;
  }) => (
    <div role="dialog">
      {file.filename}
      <button type="button" onClick={() => onSwitchIndex?.(1)}>
        next preview
      </button>
      <button type="button" onClick={() => onDownload?.(file)}>
        download preview
      </button>
    </div>
  ),
  getDownloadFileName: (file: { filename?: string }) => file.filename || 'file',
  getPreviewThumbnailUrl: () => '',
  revokeLocalPreviewUrls: vi.fn(),
  triggerFileDownload: (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  },
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Upload: Object.assign(
      ({
        children,
        disabled,
        fileList = [],
        itemRender,
        onChange,
        onPreview,
      }: React.PropsWithChildren<{
        disabled?: boolean;
        fileList?: Array<{ filename?: string; uid?: string; status?: string; response?: unknown }>;
        itemRender?: (originNode: React.ReactNode, file: { filename?: string }) => React.ReactNode;
        onChange?: (info: { fileList: Array<Record<string, unknown>> }) => void;
        onPreview?: (file: Record<string, unknown>) => void;
      }>) => (
        <div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange?.({ fileList: [{ uid: '1', status: 'done', response: { id: 1 } }] })}
          >
            change upload
          </button>
          {fileList.map((file, index) => (
            <button key={file.uid || index} type="button" onClick={() => onPreview?.(file)}>
              {itemRender ? itemRender(file.filename || 'file', file) : file.filename || 'file'}
            </button>
          ))}
          {children}
        </div>
      ),
      {
        Dragger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
      },
    ),
  };
});

describe('UploadFieldModel', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    (
      document.createElement as typeof document.createElement & {
        mockRestore?: () => void;
      }
    ).mockRestore?.();
  });

  it('renders card upload, syncs completed files and opens existing-record selector', () => {
    const onChange = vi.fn();
    const onSelectExitRecordClick = vi.fn();
    render(
      <CardUpload
        allowSelectExistingRecord
        multiple={true}
        value={[{ uid: 'file-1', filename: 'avatar.png', url: '/avatar.png' }]}
        onChange={onChange}
        onSelectExitRecordClick={onSelectExitRecordClick}
        showFileName
      />,
    );

    expect(screen.getAllByText('avatar.png')[0]).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('change upload')[0]);
    expect(onChange).toHaveBeenCalledWith([{ id: 1 }]);

    fireEvent.click(screen.getByText('Select'));
    expect(onSelectExitRecordClick).toHaveBeenCalled();
  });

  it('opens preview and downloads the current upload item', async () => {
    const click = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      blob: async () => new Blob(['content']),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:download'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement & {
        click?: () => void;
        download?: string;
        href?: string;
      };
      if (tagName === 'a') {
        element.click = click;
      }
      return element;
    });

    render(
      <CardUpload
        multiple={true}
        value={[
          { uid: 'file-1', filename: 'avatar.png', url: '/avatar.png' },
          { uid: 'file-2', filename: 'cover.png', url: '/cover.png' },
        ]}
        onChange={vi.fn()}
        showFileName
      />,
    );

    fireEvent.click(screen.getAllByText('avatar.png')[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('avatar.png');

    fireEvent.click(screen.getByText('next preview'));
    expect(screen.getByRole('dialog')).toHaveTextContent('cover.png');

    fireEvent.click(screen.getByText('download preview'));
    await waitFor(() => {
      expect(click).toHaveBeenCalled();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('initializes selector events and renders the card upload model', () => {
    const model = new UploadFieldModel();
    model.props = {
      value: [],
      onChange: vi.fn(),
    };
    model.onInit({});

    expect(model.props.onSelectExitRecordClick).toEqual(expect.any(Function));
    model.props.onSelectExitRecordClick('event');
    expect(model.dispatchEvent).toHaveBeenCalledWith('openView', { event: 'event' });
    expect(model.render().type).toBe(CardUpload);
  });

  it('registers upload settings flow handlers', () => {
    const uploadSettings = fieldModelMocks.registerFlow.mock.calls.find(([flow]) => flow.key === 'uploadSettings')[0];
    const setProps = vi.fn();
    const associationField = {
      isAssociationField: () => true,
      targetCollection: { template: 'file' },
      type: 'hasMany',
    };
    const scalarField = {
      isAssociationField: () => false,
      targetCollection: null,
      type: 'string',
    };

    expect(uploadSettings.steps.quickUpload.hideInSettings({ collectionField: scalarField })).toBe(true);
    expect(uploadSettings.steps.quickUpload.defaultParams({ collectionField: associationField })).toEqual({
      quickUpload: true,
    });
    uploadSettings.steps.quickUpload.handler({ model: { setProps } }, { quickUpload: false });
    expect(setProps).toHaveBeenCalledWith({ quickUpload: false });

    expect(uploadSettings.steps.allowMultiple.hideInSettings({ collectionField: associationField })).toBe(false);
    expect(
      uploadSettings.steps.allowMultiple.defaultParams({
        collectionField: associationField,
        model: { context: { collectionField: associationField } },
      }),
    ).toEqual({ multiple: true });
    uploadSettings.steps.allowMultiple.handler({ model: { setProps } }, { multiple: false });
    expect(setProps).toHaveBeenCalledWith({ multiple: false, maxCount: 1 });

    uploadSettings.steps.showFileName.handler({ model: { setProps } }, { showFileName: true });
    expect(setProps).toHaveBeenCalledWith('showFileName', true);

    expect(uploadSettings.steps.allowSelectExistingRecord.hideInSettings({ collectionField: scalarField })).toBe(true);
    expect(uploadSettings.steps.allowSelectExistingRecord.defaultParams({ collectionField: associationField })).toEqual(
      {
        allowSelectExistingRecord: true,
      },
    );
  });

  it('uploads through the file-manager plugin custom request flow', async () => {
    const customRequestSettings = fieldModelMocks.registerFlow.mock.calls.find(
      ([flow]) => flow.key === 'customRequestSettings',
    )[0];
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const uploadFile = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const check = vi.fn().mockResolvedValue({
      data: {
        data: {
          isSupportToUploadFiles: true,
          storage: { id: 2, type: 'local', rules: { size: 100 } },
        },
      },
    });

    await customRequestSettings.steps.step1.handler({
      api: {
        resource: () => ({ check }),
      },
      app: {
        pm: {
          get: () => ({
            getStorageType: () => ({}),
            uploadFile,
          }),
        },
      },
      collection: { dataSourceKey: 'analytics' },
      collectionField: {
        collectionName: 'users',
        name: 'avatar',
        options: { storage: 'local' },
      },
      inputArgs: {
        fileData: {
          file: new File(['content'], 'avatar.png'),
          onError,
          onProgress: vi.fn(),
          onSuccess,
        },
      },
      model: {
        props: { target: 'attachments' },
      },
      t: (value: string) => value,
    });

    expect(check).toHaveBeenCalledWith({
      fileCollectionName: 'attachments',
      uploadDataSourceKey: 'analytics',
      storageName: 'local',
    });
    expect(uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileCollectionName: 'attachments',
        storageId: 2,
        storageType: 'local',
        dataSourceKey: 'analytics',
        query: { attachmentField: 'users.avatar' },
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
    expect(onError).not.toHaveBeenCalled();
  });

  it('handles custom request fallback and upload error branches', async () => {
    const customRequestSettings = fieldModelMocks.registerFlow.mock.calls.find(
      ([flow]) => flow.key === 'customRequestSettings',
    )[0];
    const file = new File(['content'], 'avatar.png');
    const baseCtx = {
      api: {
        resource: () => ({
          check: vi.fn().mockResolvedValue({
            data: {
              data: {
                isSupportToUploadFiles: true,
                storage: { id: 2, title: 'Local', type: 'local', rules: { size: 100 } },
              },
            },
          }),
        }),
      },
      collection: { dataSourceKey: 'main' },
      collectionField: {
        collectionName: 'users',
        name: 'avatar',
        options: { storage: 'local' },
      },
      inputArgs: {
        fileData: {
          file,
          onError: vi.fn(),
          onProgress: vi.fn(),
          onSuccess: vi.fn(),
        },
      },
      model: {
        props: { target: 'attachments' },
      },
      t: (value: string, params?: Record<string, string>) =>
        value.replace('{{storageName}}', params?.storageName || ''),
    };

    await customRequestSettings.steps.step1.handler({
      ...baseCtx,
      app: {
        pm: {
          get: () => null,
        },
      },
    });
    expect(baseCtx.inputArgs.fileData.onSuccess).toHaveBeenCalledWith(file);

    const unsupportedOnError = vi.fn();
    await customRequestSettings.steps.step1.handler({
      ...baseCtx,
      api: {
        resource: () => ({
          check: vi.fn().mockResolvedValue({
            data: {
              data: {
                isSupportToUploadFiles: false,
                storage: { title: 'Read only > storage' },
              },
            },
          }),
        }),
      },
      app: {
        pm: {
          get: () => ({
            getStorageType: () => ({}),
            uploadFile: vi.fn(),
          }),
        },
      },
      inputArgs: {
        fileData: {
          ...baseCtx.inputArgs.fileData,
          onError: unsupportedOnError,
          onSuccess: vi.fn(),
        },
      },
    });
    expect(unsupportedOnError.mock.calls[0][0]).toHaveProperty(
      'message',
      'The current storage "Read only > storage" does not support file uploads.',
    );

    const customRequest = vi.fn(({ onSuccess }) => onSuccess({ id: 9 }));
    const customOnSuccess = vi.fn();
    await customRequestSettings.steps.step1.handler({
      ...baseCtx,
      app: {
        pm: {
          get: () => ({
            getStorageType: () => ({
              createUploadCustomRequest: () => customRequest,
            }),
            uploadFile: vi.fn(),
          }),
        },
      },
      inputArgs: {
        fileData: {
          ...baseCtx.inputArgs.fileData,
          onSuccess: customOnSuccess,
        },
      },
    });
    expect(customRequest).toHaveBeenCalled();
    expect(customOnSuccess).toHaveBeenCalledWith({ id: 9 });

    const uploadError = vi.fn().mockResolvedValue({ errorMessage: 'Upload failed' });
    const uploadOnError = vi.fn();
    await customRequestSettings.steps.step1.handler({
      ...baseCtx,
      app: {
        pm: {
          get: () => ({
            getStorageType: () => ({}),
            uploadFile: uploadError,
          }),
        },
      },
      inputArgs: {
        fileData: {
          ...baseCtx.inputArgs.fileData,
          onError: uploadOnError,
          onSuccess: vi.fn(),
        },
      },
    });
    expect(uploadOnError.mock.calls[0][0]).toHaveProperty('message', 'Upload failed');
  });

  it('opens existing-record selector and writes selected rows back to the field', () => {
    const selectRecordSettings = fieldModelMocks.registerFlow.mock.calls.find(
      ([flow]) => flow.key === 'selectExitRecordSettings',
    )[0];
    const open = vi.fn();
    const change = vi.fn();
    const closeView = vi.fn();
    const quickEditPopover = { update: vi.fn() };
    const selectedRows = { value: [] };
    const contentElement = document.createElement('div');

    selectRecordSettings.steps.openView.handler(
      {
        collection: {
          dataSourceKey: 'main',
          filterTargetKey: 'id',
        },
        collectionField: {
          name: 'avatar',
          target: 'attachments',
          type: 'belongsTo',
        },
        inputArgs: {},
        isMobileLayout: false,
        layoutContentElement: contentElement,
        model: {
          _closeView: closeView,
          change,
          flowEngine: {
            context: {
              themeToken: {
                colorBgLayout: '#f7f7f7',
              },
            },
          },
          getStepParams: () => ({ allowSelectExistingRecord: true }),
          parent: {
            use: 'QuickEditFormModel',
            viewContainer: quickEditPopover,
          },
          props: {
            value: { id: 1 },
          },
          selectedRows,
          uid: 'field-model',
        },
        viewer: { open },
      },
      { mode: 'drawer', size: 'medium' },
    );

    const openOptions = open.mock.calls[0][0];
    expect(openOptions).toEqual(
      expect.objectContaining({
        type: 'drawer',
        width: '50%',
        target: contentElement,
      }),
    );
    expect(openOptions.inputArgs.rowSelectionProps.type).toBe('radio');

    openOptions.inputArgs.rowSelectionProps.onChange(null, [{ id: 2 }]);
    expect(selectedRows.value).toEqual({ id: 2 });
    expect(change).toHaveBeenCalled();
    expect(closeView).toHaveBeenCalled();
    expect(quickEditPopover.update).toHaveBeenCalledWith({ preventClose: true });
  });

  it('deduplicates multi-select existing records by the collection target key', () => {
    const selectRecordSettings = fieldModelMocks.registerFlow.mock.calls.find(
      ([flow]) => flow.key === 'selectExitRecordSettings',
    )[0];
    const open = vi.fn();
    const selectedRows = { value: [] };

    selectRecordSettings.steps.openView.handler(
      {
        collection: {
          dataSourceKey: 'main',
          filterTargetKey: 'id',
        },
        collectionField: {
          name: 'files',
          target: 'attachments',
          type: 'hasMany',
        },
        inputArgs: { mode: 'dialog', size: 'small' },
        isMobileLayout: false,
        layoutContentElement: document.createElement('div'),
        model: {
          flowEngine: {
            context: {
              themeToken: {
                colorBgLayout: '#f7f7f7',
              },
            },
          },
          getStepParams: () => ({ allowSelectExistingRecord: true }),
          parent: null,
          props: {
            value: [{ id: 1, filename: 'old.png' }],
          },
          selectedRows,
          uid: 'field-model',
        },
        viewer: { open },
      },
      { mode: 'drawer', size: 'medium' },
    );

    const openOptions = open.mock.calls[0][0];
    expect(openOptions.inputArgs.rowSelectionProps.type).toBe('checkbox');
    openOptions.inputArgs.rowSelectionProps.onChange(null, [
      { id: 1, filename: 'old.png' },
      { id: 2, filename: 'new.png' },
    ]);
    expect(selectedRows.value).toEqual([
      { id: 1, filename: 'old.png' },
      { id: 2, filename: 'new.png' },
    ]);
  });

  it('binds the upload field model to file-like interfaces', () => {
    expect(fieldModelMocks.define).toHaveBeenCalledWith({ label: 'File picker' });
    expect(fieldModelMocks.bindModelToInterface).toHaveBeenCalledWith(
      'UploadFieldModel',
      expect.arrayContaining(['attachment', 'm2m', 'm2o']),
      expect.objectContaining({
        isDefault: true,
        order: 30,
        when: expect.any(Function),
      }),
    );
  });
});
