/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';

describe('attachment URL file collection options', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'error-handler',
        'field-sort',
        'users',
        'auth',
        'data-source-main',
        'file-manager',
        'field-attachment-url',
      ],
    });

    await app.db.getCollection('collections').repository.create({
      values: {
        name: 'privateFiles',
        title: 'Private files',
        template: 'file',
        options: {
          template: 'file',
        },
      },
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('includes private custom file collections and excludes the built-in attachments collection', async () => {
    const response = await app.agent().resource('collections').listFileCollectionsWithPublicStorage({
      paginate: false,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toContainEqual({
      title: 'Private files',
      name: 'privateFiles',
    });
    expect(response.body.data).not.toContainEqual(expect.objectContaining({ name: 'attachments' }));
  });
});
