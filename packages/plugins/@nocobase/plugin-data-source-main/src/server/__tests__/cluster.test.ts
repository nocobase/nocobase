/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockCluster, sleep } from '@nocobase/test';

describe('cluster', () => {
  let cluster;
  beforeEach(async () => {
    cluster = await createMockCluster({
      plugins: ['error-handler', 'field-sort', 'data-source-main', 'ui-schema-storage'],
      acl: false,
    });
  });

  afterEach(async () => {
    await cluster.destroy();
  });

  describe('sync collection', () => {
    test('create collection', async () => {
      const [app1, app2] = cluster.nodes;

      await app1.db.getRepository('collections').create({
        values: {
          name: 'tests',
          fields: [
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
        context: {},
      });

      await sleep(2000);

      const testsCollection = app2.db.getCollection('tests');
      expect(testsCollection).toBeTruthy();
    });

    test('update collection', async () => {
      const [app1, app2] = cluster.nodes;

      await app1.db.getRepository('collections').create({
        values: {
          name: 'tests',
          fields: [
            {
              name: 'name',
              type: 'string',
            },
          ],
          description: 'test collection',
        },
        context: {},
      });

      await sleep(2000);

      const testsCollection = app2.db.getCollection('tests');
      expect(testsCollection).toBeTruthy();

      await app1.db.getRepository('collections').update({
        filterByTk: 'tests',
        values: {
          description: 'new test collection',
        },
        context: {},
      });

      await sleep(2000);

      expect(testsCollection.options.description).toBe('new test collection');
    });

    test('destroy collection', async () => {
      const [app1, app2] = cluster.nodes;

      await app1.db.getRepository('collections').create({
        values: {
          name: 'tests',
          fields: [
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
        context: {},
      });

      await sleep(2000);

      const testsCollection = app2.db.getCollection('tests');
      expect(testsCollection).toBeTruthy();

      await app1.db.getRepository('collections').destroy({
        filterByTk: 'tests',
        context: {},
      });

      await sleep(2000);

      expect(app2.db.getCollection('tests')).toBeFalsy();
    });
  });

  describe('sync fields', () => {
    test('create field', async () => {
      const [app1, app2] = cluster.nodes;

      await app1.db.getRepository('collections').create({
        values: {
          name: 'tests',
          fields: [
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
        context: {},
      });

      await sleep(2000);

      const testsCollection = app2.db.getCollection('tests');
      expect(testsCollection).toBeTruthy();

      await app1.db.getRepository('fields').create({
        values: {
          name: 'age',
          type: 'integer',
          collectionName: 'tests',
        },
        context: {},
      });

      await sleep(2000);

      const ageField = testsCollection.getField('age');
      expect(ageField).toBeTruthy();
    });

    test('update field', async () => {
      const [app1, app2] = cluster.nodes;

      await app1.db.getRepository('collections').create({
        values: {
          name: 'tests',
          fields: [
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
        context: {},
      });

      await sleep(2000);

      const testsCollection = app2.db.getCollection('tests');
      expect(testsCollection).toBeTruthy();

      await app1.db.getRepository('fields').create({
        values: {
          name: 'age',
          type: 'integer',
          collectionName: 'tests',
        },
        context: {},
      });

      await sleep(2000);

      await app1.db.getRepository('collections.fields', 'tests').update({
        filterByTk: 'age',
        values: {
          description: 'age field',
        },
        context: {},
      });

      await sleep(2000);

      const ageField = testsCollection.getField('age');
      expect(ageField).toBeTruthy();

      expect(ageField.options.description).toBe('age field');
    });

    test('destroy field', async () => {
      const [app1, app2] = cluster.nodes;

      await app1.db.getRepository('collections').create({
        values: {
          name: 'tests',
          fields: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'age',
              type: 'integer',
            },
          ],
        },
        context: {},
      });

      await sleep(2000);

      const testsCollection = app2.db.getCollection('tests');
      expect(testsCollection).toBeTruthy();

      await app1.db.getRepository('collections.fields', 'tests').destroy({
        filterByTk: 'age',
        context: {},
      });

      await sleep(2000);

      expect(testsCollection.getField('age')).toBeFalsy();
    });
  });
});
