/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { createApp } from '../index';
import { Database, MigrationContext } from '@nocobase/database';
import Migrator from '../../migrations/20240517101001-fix-target-option-in-tree-collection';

describe('fix target option in tree collection', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp({});

    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should remove target options', async () => {
    await app.db.getRepository('collections').create({
      values: {
        logging: true,
        autoGenId: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        fields: [
          {
            interface: 'integer',
            name: 'parentId',
            type: 'bigInt',
            isForeignKey: true,
            uiSchema: {
              type: 'number',
              title: '{{t("Parent ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
            target: 'treeTests',
          },
          {
            interface: 'm2o',
            type: 'belongsTo',
            name: 'parent',
            foreignKey: 'parentId',
            treeParent: true,
            onDelete: 'CASCADE',
            uiSchema: {
              title: '{{t("Parent")}}',
              'x-component': 'AssociationField',
              'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
            },
            target: 'treeTests',
          },
          {
            interface: 'o2m',
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parentId',
            treeChildren: true,
            onDelete: 'CASCADE',
            uiSchema: {
              title: '{{t("Children")}}',
              'x-component': 'AssociationField',
              'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
            },
            target: 'treeTests',
          },
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            uiSchema: {
              type: 'number',
              title: '{{t("ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
            interface: 'integer',
            target: 'treeTests',
          },
          {
            name: 'createdAt',
            interface: 'createdAt',
            type: 'date',
            field: 'createdAt',
            uiSchema: {
              type: 'datetime',
              title: '{{t("Created at")}}',
              'x-component': 'DatePicker',
              'x-component-props': {},
              'x-read-pretty': true,
            },
          },
          {
            name: 'createdBy',
            interface: 'createdBy',
            type: 'belongsTo',
            target: 'users',
            foreignKey: 'createdById',
            uiSchema: {
              type: 'object',
              title: '{{t("Created by")}}',
              'x-component': 'AssociationField',
              'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
              'x-read-pretty': true,
            },
          },
          {
            type: 'date',
            field: 'updatedAt',
            name: 'updatedAt',
            interface: 'updatedAt',
            uiSchema: {
              type: 'string',
              title: '{{t("Last updated at")}}',
              'x-component': 'DatePicker',
              'x-component-props': {},
              'x-read-pretty': true,
            },
          },
          {
            type: 'belongsTo',
            target: 'users',
            foreignKey: 'updatedById',
            name: 'updatedBy',
            interface: 'updatedBy',
            uiSchema: {
              type: 'object',
              title: '{{t("Last updated by")}}',
              'x-component': 'AssociationField',
              'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
              'x-read-pretty': true,
            },
          },
        ],
        name: 'treeTests',
        template: 'tree',
        view: false,
        tree: 'adjacencyList',
        title: 'treeTests',
      },
    });

    const idFieldBeforeMigrate = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'treeTests',
        name: 'id',
      },
    });

    expect(idFieldBeforeMigrate.get('target')).toBe('treeTests');

    const migration = new Migrator({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    const idField = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'treeTests',
        name: 'id',
      },
    });

    expect(idField.get('target')).toBeUndefined();
  });
});
