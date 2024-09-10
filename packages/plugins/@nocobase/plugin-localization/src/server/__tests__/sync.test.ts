/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { MockServer, createMockServer } from '@nocobase/test';
import { getSchemaUid, getTextsFromDB, getTextsFromMenu } from '../actions/localization';
import { getMenuSchema, getMobileMenuSchema } from './utils';

describe('sync', () => {
  let app: MockServer;
  let agent: any;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        // 'data-source-manager',
        'field-sort',
        'data-source-main',
        'localization',
        'ui-schema-storage',
        'client',
        'mobile-client',
        'error-handler',
      ],
    });
    await app.localeManager.load();
    agent = app.agent();
    repo = app.db.getRepository('localizationTexts');
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should check sync types', async () => {
    const res = await agent.resource('localization').sync({
      types: [],
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe('Please provide synchronization source.');
  });

  it('should sync local resources', async () => {
    vi.spyOn(app.localeManager, 'getResources').mockResolvedValue({
      test: {
        'sync.local.test1': 'Test1',
        'sync.local.test2': 'Test2',
      },
    });
    const res = await agent.resource('localization').sync({
      values: {
        types: ['local'],
      },
    });
    expect(res.status).toBe(200);
    const texts = await repo.find({
      filter: {
        text: {
          $in: ['sync.local.test1', 'sync.local.test2'],
        },
        module: 'resources.test',
        'translations.locale': 'en-US',
      },
      appends: ['translations'],
    });
    expect(texts.length).toBe(2);
    expect(texts[0].translations[0].translation).toBe('Test1');
    expect(texts[1].translations[0].translation).toBe('Test2');
  });

  it('should get texts from menu', async () => {
    const { adminSchemaUid, mobileSchemaUid } = await getSchemaUid(app.db);
    const repo = app.db.getRepository('uiSchemas') as UiSchemaRepository;
    await repo.insertAdjacent('beforeEnd', adminSchemaUid, getMenuSchema('test'));
    await repo.insertAdjacent('beforeEnd', mobileSchemaUid, getMobileMenuSchema('test-mobile'));
    const result = await getTextsFromMenu(app.db);
    expect(Object.keys(result)).toEqual(['test', 'test-mobile']);
  });

  it('should get texts from db', async () => {
    await app.db.getRepository('collections').create({
      values: {
        key: 'test-collection',
        name: 'sync.db.collection',
        title: 'sync.db.collection',
      },
      hooks: false,
    });
    await app.db.getRepository('fields').create({
      values: {
        key: 'test-field',
        name: 'sync.db.field',
        title: 'sync.db.field',
        collectionNname: 'sync.db.collection',
        options: {
          uiSchema: {
            title: '{{t("sync.db.field")}}',
            enum: [{ label: 'sync.db.enum', value: '1' }],
          },
        },
      },
      hooks: false,
    });
    const result = await getTextsFromDB(app.db);
    expect(Object.keys(result)).toMatchObject(['sync.db.collection', 'sync.db.field', 'sync.db.enum']);
  });

  it('should add text when adding menu item', async () => {
    vi.spyOn(repo, 'create');
    const title = 'sync.menu.hook';
    const text = await repo.findOne({
      filter: {
        text: title,
      },
    });
    expect(text).toBeNull();
    const { adminSchemaUid } = await getSchemaUid(app.db);
    const schemaRepo = app.db.getRepository('uiSchemas') as UiSchemaRepository;
    await schemaRepo.insertAdjacent('beforeEnd', adminSchemaUid, getMenuSchema(title, true));
    expect(repo.create).toBeCalledWith({
      values: {
        module: 'resources.lm-menus',
        text: title,
      },
    });
  });

  it('should add text when creating fields', async () => {
    const model = app.db.getModel('localizationTexts');
    vi.spyOn(model, 'bulkCreate');
    await app.db.getRepository('fields').create({
      values: {
        name: 'sync.db.field',
        title: 'sync.db.field',
        collectionNname: 'sync.db.collection',
        options: {
          uiSchema: {
            title: '{{t("sync.db.field")}}',
            enum: [{ label: 'sync.db.enum', value: '1' }],
          },
        },
      },
    });
    expect(model.bulkCreate).toBeCalledWith(
      [
        {
          module: 'resources.lm-collections',
          text: 'sync.db.field',
        },
        {
          module: 'resources.lm-collections',
          text: 'sync.db.enum',
        },
      ],
      { transaction: expect.anything() },
    );
  });
});
