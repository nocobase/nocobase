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

class TestOfficialPluginLocaleSourcePlugin extends Plugin {
  async beforeLoad() {
    this.app.db.collection({
      name: 'testOfficialPluginLocaleSources',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
      ],
    });

    this.app.localeManager.registerSource('test-official-plugin-locale-source', {
      title: 'Test official plugin locale source',
      namespace: '@nocobase/plugin-workflow-cc',
      collections: [
        {
          collection: 'testOfficialPluginLocaleSources',
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

  it('normalizes official plugin package name when source collection fields are saved', async () => {
    app = await createMockServer({
      plugins: ['localization', TestOfficialPluginLocaleSourcePlugin],
    });
    await app.localeManager.load();

    await app.db.getRepository('testOfficialPluginLocaleSources').create({
      values: {
        title: 'Test official plugin title',
      },
    });

    const normalizedText = await app.db.getRepository('localizationTexts').findOne({
      filter: {
        module: 'resources.workflow-cc',
        text: 'Test official plugin title',
      },
    });
    const legacyText = await app.db.getRepository('localizationTexts').findOne({
      filter: {
        module: 'resources.@nocobase/plugin-workflow-cc',
        text: 'Test official plugin title',
      },
    });

    expect(normalizedText).toBeTruthy();
    expect(legacyText).toBeFalsy();
  });
});
