/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client-v2';
import { describe, expect, it } from 'vitest';
import { AttachmentFieldInterface } from '../interfaces/attachment';
import PluginFileManagerClientV2 from '../plugin';

describe('AttachmentFieldInterface', () => {
  it('provides v2 data source manager metadata for attachment fields', async () => {
    const app = new Application({
      plugins: [PluginFileManagerClientV2],
    });

    await app.load();

    const fieldInterface =
      app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface<AttachmentFieldInterface>('attachment');

    expect(fieldInterface).toBeInstanceOf(AttachmentFieldInterface);
    expect(fieldInterface.group).toBe('media');
    expect(fieldInterface.creatable).toBe(false);
    expect(fieldInterface.default).toMatchObject({
      interface: 'attachment',
      type: 'belongsToMany',
      target: 'attachments',
      uiSchema: {
        type: 'array',
        'x-component': 'Upload.Attachment',
      },
    });
    expect(fieldInterface.configure?.items?.map((item) => item.name)).toEqual([
      'target',
      'targetKey',
      'uiSchema.x-component-props.accept',
      'uiSchema.x-component-props.multiple',
    ]);
  });

  it('initializes required belongsToMany keys', () => {
    const fieldInterface = new AttachmentFieldInterface({} as never);
    const values: Record<string, unknown> = {};

    fieldInterface.initialize(values);

    expect(values).toMatchObject({
      sourceKey: 'id',
      targetKey: 'id',
    });
    expect(values.through).toMatch(/^t_/);
    expect(values.foreignKey).toMatch(/^f_/);
    expect(values.otherKey).toMatch(/^f_/);
  });
});
