/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import Migration from '../../migrations/20260630234000-migrate-attachment-fields-to-m2m';
import PluginFileManagerServer from '../../server';

describe('file-manager > migrate attachment fields to m2m', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'error-handler',
        'field-sort',
        'users',
        'auth',
        'file-manager',
        'data-source-main',
        'ui-schema-storage',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('should migrate attachment field metadata to belongsToMany m2m without losing upload options', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'posts',
        title: 'Posts',
      },
    });
    await app.db.getRepository('fields').create({
      values: {
        key: uid(),
        sort: 1,
        collectionName: 'posts',
        name: 'files',
        type: 'belongsToMany',
        interface: 'attachment',
        target: 'attachments',
        through: 'posts_files',
        foreignKey: 'postId',
        otherKey: 'attachmentId',
        sourceKey: 'id',
        targetKey: 'id',
        storage: 'local',
        uiSchema: {
          type: 'array',
          title: 'Files',
          'x-component': 'Upload.Attachment',
          'x-component-props': {
            accept: 'image/*',
            multiple: true,
          },
        },
      },
      hooks: false,
    });
    await app.db.getRepository('collections').load({
      filter: {
        name: 'posts',
      },
    });

    expect(app.db.getCollection('posts').getField('files').options.interface).toBe('attachment');

    const migration = new Migration({
      db: app.db,
      app,
      plugin: app.pm.get(PluginFileManagerServer),
    });

    await migration.up();
    await migration.up();

    const field = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'posts',
        name: 'files',
      },
    });

    expect(field.get('type')).toBe('belongsToMany');
    expect(field.get('interface')).toBe('m2m');
    expect(field.get('target')).toBe('attachments');
    expect(field.get('through')).toBe('posts_files');
    expect(field.get('foreignKey')).toBe('postId');
    expect(field.get('otherKey')).toBe('attachmentId');
    expect(field.get('storage')).toBe('local');
    expect(field.get('uiSchema.x-component')).toBe('Upload.Attachment');
    expect(field.get('uiSchema.x-use-component-props')).toBe('useAttachmentFieldProps');
    expect(field.get('uiSchema.x-component-props.accept')).toBe('image/*');
    expect(field.get('uiSchema.x-component-props.multiple')).toBe(true);

    const runtimeFieldOptions = app.db.getCollection('posts').getField('files').options;
    expect(runtimeFieldOptions.interface).toBe('m2m');
    expect(runtimeFieldOptions.target).toBe('attachments');
    expect(runtimeFieldOptions.through).toBe('posts_files');
    expect(runtimeFieldOptions.storage).toBe('local');
  });
});
