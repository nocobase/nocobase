/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { createMockServer, MockServer } from '@nocobase/test';

class TestLocaleSourcePlugin extends Plugin {
  async beforeLoad() {
    this.app.db.collection({
      name: 'testLocaleSources',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
      ],
    });

    this.app.localeManager.registerSource('test-locale-source', {
      title: 'Test locale source',
      namespace: 'test-locale-source',
      sync: async () => ({}),
      collections: [
        {
          collection: 'testLocaleSources',
          fields: ['title'],
        },
      ],
    });
  }
}

describe('locale source', () => {
  let app: MockServer;

  afterEach(async () => {
    await app?.destroy();
  });

  it('adds localization texts when source collection fields are saved', async () => {
    app = await createMockServer({
      plugins: ['localization', TestLocaleSourcePlugin],
    });
    await app.localeManager.load();

    await app.db.getRepository('testLocaleSources').create({
      values: {
        title: 'Test source title',
      },
    });

    const text = await app.db.getRepository('localizationTexts').findOne({
      filter: {
        module: 'resources.test-locale-source',
        text: 'Test source title',
      },
    });

    expect(text).toBeTruthy();
  });
});
