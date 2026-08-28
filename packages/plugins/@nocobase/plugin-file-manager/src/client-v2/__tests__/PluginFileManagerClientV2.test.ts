/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PluginFileManagerClientV2 } from '../plugin';

vi.mock('@nocobase/client-v2', () => ({
  CollectionFieldInterface: class CollectionFieldInterface {},
  Plugin: class Plugin {},
}));

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

function createPlugin() {
  const registerCollectionTemplate = vi.fn();
  const addMenuItem = vi.fn();
  const addPageTabItem = vi.fn();
  const registerModelLoaders = vi.fn();
  const request = vi.fn();
  const addFieldInterfaces = vi.fn();
  const plugin = Object.create(PluginFileManagerClientV2.prototype) as PluginFileManagerClientV2 & {
    app: {
      addFieldInterfaces: typeof addFieldInterfaces;
      apiClient: { request: typeof request };
      i18n: { t: (value: string) => string };
      pm: { get: (name: string) => unknown };
    };
    pluginSettingsManager: {
      addMenuItem: typeof addMenuItem;
      addPageTabItem: typeof addPageTabItem;
    };
    flowEngine: {
      registerModelLoaders: typeof registerModelLoaders;
    };
  };
  plugin.storageTypes = new Map();
  plugin.app = {
    addFieldInterfaces,
    apiClient: { request },
    i18n: { t: (value) => value },
    pm: {
      get: (name) => (name === '@nocobase/plugin-data-source-manager' ? { registerCollectionTemplate } : undefined),
    },
  };
  plugin.pluginSettingsManager = {
    addMenuItem,
    addPageTabItem,
  };
  plugin.flowEngine = {
    registerModelLoaders,
  };

  return {
    plugin,
    addFieldInterfaces,
    addMenuItem,
    addPageTabItem,
    registerCollectionTemplate,
    registerModelLoaders,
    request,
  };
}

describe('PluginFileManagerClientV2', () => {
  it('registers file collection template, settings page, built-in storage types and model loaders', async () => {
    const {
      plugin,
      addFieldInterfaces,
      addMenuItem,
      addPageTabItem,
      registerCollectionTemplate,
      registerModelLoaders,
    } = createPlugin();

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([expect.any(Function)]);
    expect(registerCollectionTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'file',
        title: 'File collection',
        collection: expect.objectContaining({
          options: expect.objectContaining({ template: 'file' }),
        }),
      }),
    );
    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'file-manager',
        title: 'File manager',
        aclSnippet: 'pm.file-manager.storages',
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'file-manager',
        key: 'index',
        title: 'File manager',
      }),
    );
    expect([...plugin.storageTypes.keys()]).toEqual(['local', 'ali-oss', 's3', 'tx-cos']);
    expect(plugin.getStorageType('local')?.defaultValues).toMatchObject({
      baseUrl: '/storage/uploads',
      renameMode: 'appendRandomID',
      options: { documentRoot: 'storage/uploads', useOriginalUrl: false },
    });
    expect(registerModelLoaders).toHaveBeenCalledWith({
      DisplayPreviewFieldModel: { loader: expect.any(Function) },
      UploadActionModel: { loader: expect.any(Function) },
      UploadFieldModel: { loader: expect.any(Function) },
    });
  });

  it('allows third-party storage types to override the upload pipeline', async () => {
    const { plugin, request } = createPlugin();
    const upload = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    plugin.registerStorageType('custom', {
      title: 'Custom',
      formLoader: async () => ({ default: () => null }),
      upload,
    });

    await expect(
      plugin.uploadFile({
        file,
        storageType: 'custom',
        storageId: 2,
        storageRules: { size: 100 },
        dataSourceKey: 'external',
        query: { attachmentField: 'users.avatar' },
      }),
    ).resolves.toEqual({ data: { id: 1, local: false } });

    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        storageType: 'custom',
        storageId: 2,
        dataSourceKey: 'external',
        fileCollectionName: 'attachments',
        query: {
          attachmentField: 'users.avatar',
          uploadDataSourceKey: 'external',
        },
      }),
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('uploads files through the default multipart API path', async () => {
    const { plugin, request } = createPlugin();
    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    request.mockResolvedValue({ data: { data: { id: 1, filename: 'avatar.png' } } });

    await expect(
      plugin.uploadFile({
        file,
        fileCollectionName: 'files',
        dataSourceKey: 'analytics',
        query: { attachmentField: 'users.avatar' },
      }),
    ).resolves.toEqual({ data: { id: 1, filename: 'avatar.png' } });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'files:create?attachmentField=users.avatar&uploadDataSourceKey=analytics',
        method: 'post',
        data: expect.any(FormData),
      }),
    );
  });

  it('returns upload errors without throwing', async () => {
    const { plugin, request } = createPlugin();

    await expect(plugin.uploadFile()).resolves.toEqual({ errorMessage: 'Missing file' });

    request.mockRejectedValue(new Error('network down'));
    await expect(plugin.uploadFile({ file: new File(['content'], 'avatar.png') })).resolves.toEqual({
      errorMessage: 'network down',
    });

    request.mockRejectedValue('failed');
    await expect(plugin.uploadFile({ file: new File(['content'], 'avatar.png') })).resolves.toEqual({
      errorMessage: 'Upload failed',
    });
  });
});
