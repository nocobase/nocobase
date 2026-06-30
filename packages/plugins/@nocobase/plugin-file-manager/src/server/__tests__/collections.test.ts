/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import path from 'path';
import { FILE_FIELD_NAME } from '../../constants';

describe('attachments collection manager integration', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      acl: false,
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

  it('should expose attachments to blocks and permission configuration', async () => {
    const collectionsResponse = await app.agent().resource('collections').listMeta();
    const attachments = collectionsResponse.body.data.find((collection) => collection.name === 'attachments');

    expect(collectionsResponse.status).toBe(200);
    expect(attachments).toMatchObject({
      name: 'attachments',
      title: "{{t('Attachments', { ns: 'file-manager' })}}",
      loadedFromCollectionManager: true,
      uiManageable: true,
    });
    expect(attachments.fields.some((field) => field.name === 'id' && field.interface === 'snowflakeId')).toBe(true);
    expect(attachments.fields.some((field) => field.name === 'title')).toBe(true);
    expect(attachments.fields.some((field) => field.name === 'filename')).toBe(true);
    expect(app.acl.getStrategyResources()).toContain('attachments');
  });

  it('should not allow deleting attachments system fields', async () => {
    for (const fieldName of ['id', 'title', 'createdBy', 'createdById', 'updatedBy', 'updatedById']) {
      const response = await app.agent().resource('collections.fields', 'attachments').destroy({
        filterByTk: fieldName,
      });

      expect(response.status).toBe(500);
    }

    const fields = await app.db.getRepository('fields').find({
      filter: {
        collectionName: 'attachments',
      },
    });
    for (const fieldName of ['id', 'title', 'createdBy', 'createdById', 'updatedBy', 'updatedById']) {
      expect(fields.some((field) => field.get('name') === fieldName)).toBe(true);
      expect(app.db.getCollection('attachments').hasField(fieldName)).toBe(true);
    }
  });

  it('should not allow deleting attachments collection', async () => {
    const response = await app.agent().resource('collections').destroy({
      filterByTk: 'attachments',
    });

    expect(response.status).toBe(500);
    expect(
      await app.db.getRepository('collections').findOne({
        filter: {
          name: 'attachments',
        },
      }),
    ).toBeTruthy();
    expect(app.db.hasCollection('attachments')).toBe(true);
  });

  it('should not allow creating attachment interface fields', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'posts',
          title: 'Posts',
        },
      });

    const response = await app
      .agent()
      .resource('collections.fields', 'posts')
      .create({
        values: {
          name: 'files',
          type: 'belongsToMany',
          interface: 'attachment',
          target: 'attachments',
        },
      });

    expect(response.status).toBe(500);
    expect(response.body.errors?.[0]?.message || response.body.message).toContain(
      'The attachment field type is no longer supported',
    );
  });
});

describe('attachments create permission', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      acl: true,
      plugins: [
        'acl',
        'error-handler',
        'field-sort',
        'users',
        'ui-schema-storage',
        'data-source-main',
        'auth',
        'data-source-manager',
        'collection-tree',
        'file-manager',
        'system-settings',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('should require attachments create permission when X-Role is omitted', async () => {
    const user = await app.db.getRepository('users').create({
      values: {
        roles: ['member'],
      },
    });
    const agent = await app.agent().login(user);

    const deniedResponse = await agent.resource('attachments').create({
      [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
    });

    expect(deniedResponse.status).toBe(403);

    app.acl.getRole('member').grantAction('attachments:create', {});

    const allowedResponse = await agent.resource('attachments').create({
      [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
    });

    expect(allowedResponse.status).toBe(200);
    expect(allowedResponse.body.data).toMatchObject({
      title: 'text',
      mimetype: 'text/plain',
    });
  });
});
