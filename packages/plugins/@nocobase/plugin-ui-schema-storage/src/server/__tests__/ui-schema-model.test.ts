/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { UiSchemaRepository } from '..';

describe('ui schema model', () => {
  let app: MockServer;
  let db: Database;

  let RelatedCollection: Collection;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-schema-storage'],
    });

    db = app.db;
    RelatedCollection = db.collection({
      name: 'hasUiSchemaCollection',
      fields: [
        {
          type: 'belongsTo',
          name: 'uiSchema',
          target: 'uiSchemas',
        },
      ],
    });

    await db.sync();
  });

  it('should create schema tree after ui_schema created', async () => {
    const uiSchemaRepository = db.getCollection('uiSchemas').repository as UiSchemaRepository;

    await RelatedCollection.repository.create({
      updateAssociationValues: ['uiSchema'],
      values: {
        uiSchema: {
          'x-uid': 'root-uid',
          title: 'root-node',
          name: 'root-node',
          properties: {
            child1: {
              title: 'child1',
            },
          },
        },
      },
    });

    const child1 = await uiSchemaRepository.findOne({
      filter: {
        name: 'child1',
      },
    });

    const tree = await uiSchemaRepository.getJsonSchema('root-uid');
    expect(tree).toMatchObject({
      title: 'root-node',
      properties: {
        child1: {
          title: 'child1',
          'x-uid': child1.get('x-uid'),
          'x-async': false,
          'x-index': 1,
        },
      },
      name: 'root-node',
      'x-uid': 'root-uid',
      'x-async': false,
    });
  });

  it('should update schema tree after ui_schema updated', async () => {
    const uiSchemaRepository = db.getCollection('uiSchemas').repository as UiSchemaRepository;

    const relatedInstance = await RelatedCollection.repository.create({
      updateAssociationValues: ['uiSchema'],
      values: {
        uiSchema: {
          'x-uid': 'root-uid',
          title: 'root-node',
          name: 'root-node',
          properties: {
            child1: {
              title: 'child1',
            },
          },
        },
      },
    });

    const child1 = await uiSchemaRepository.findOne({
      filter: {
        name: 'child1',
      },
    });

    await RelatedCollection.repository.update({
      updateAssociationValues: ['uiSchema'],
      filterByTk: relatedInstance.get('id') as string,
      values: {
        uiSchema: {
          'x-uid': 'root-uid',
          title: 'new-root-title',
          name: 'new-root-name',
          properties: {
            child1: {
              title: 'new-child1-title',
            },
          },
        },
      },
    });

    const tree = await uiSchemaRepository.getJsonSchema('root-uid');

    expect(tree).toMatchObject({
      title: 'new-root-title',
      properties: {
        child1: {
          title: 'new-child1-title',
          'x-uid': child1.get('x-uid'),
          'x-async': false,
          'x-index': 1,
        },
      },
      name: 'new-root-name',
      'x-uid': 'root-uid',
      'x-async': false,
    });
  });
});
