/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterfaceManager } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentURLFieldModel, PluginFieldAttachmentUrlClient } from '../index';
import { FileCollectionSelect } from '../FileCollectionSelect';
import { AttachmentURLFieldInterface } from '../interfaces/attachment-url';

describe('AttachmentURLFieldInterface', () => {
  it('registers the attachment URL interface and field model loader', async () => {
    const addFieldInterfaces = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginFieldAttachmentUrlClient.prototype) as PluginFieldAttachmentUrlClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      addFieldInterfaces,
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([AttachmentURLFieldInterface]);
    expect(registerModelLoaders).toHaveBeenCalledWith({
      AttachmentURLFieldModel: {
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.AttachmentURLFieldModel.loader()).resolves.toHaveProperty(
      'AttachmentURLFieldModel',
      AttachmentURLFieldModel,
    );
  });

  it('defines the attachment URL field schema and configuration', () => {
    const fieldInterface = new AttachmentURLFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'attachmentURL',
      type: 'object',
      group: 'media',
      supportDataSourceType: ['main'],
      title: '{{t("Attachment (URL)")}}',
      default: {
        interface: 'attachmentURL',
        type: 'string',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
        },
      },
      availableTypes: ['string', 'text'],
      validationType: 'string',
      availableValidationOptions: ['min', 'max', 'length', 'pattern'],
      filterable: {
        operators: 'bigField',
        nested: true,
      },
      titleUsable: true,
    });
    expect(fieldInterface.configure.items).toEqual([
      expect.objectContaining({
        name: 'target',
        Component: FileCollectionSelect,
        required: true,
      }),
      expect.objectContaining({
        name: 'targetKey',
        defaultValue: 'id',
        hidden: true,
      }),
    ]);
  });

  it('is available only for the main data source', () => {
    const manager = new CollectionFieldInterfaceManager({});
    manager.addFieldInterfaces([AttachmentURLFieldInterface]);

    expect(manager.getFieldInterfaces('main')).toContainEqual(expect.objectContaining({ name: 'attachmentURL' }));
    expect(manager.getFieldInterfaces('postgres')).not.toContainEqual(
      expect.objectContaining({ name: 'attachmentURL' }),
    );
  });
});
