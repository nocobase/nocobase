/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { createApp } from '..';

describe.runIf(process.env.DB_DIALECT === 'postgres')('sync PostgreSQL inherited fields', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('keeps inheritance and an intentional override across two syncs and parent edits', async () => {
    const { db } = app;
    const agent = app.agent();
    const fields = db.getRepository('fields');
    const stringField = (name: string, title: string) => ({
      name,
      type: 'string',
      interface: 'input',
      uiSchema: { title },
    });
    const collections = agent.resource('collections');
    expect(
      (
        await collections.create({
          values: {
            name: 'animals',
            hidden: false,
            fields: [
              { ...stringField('title', 'Parent title'), allowNull: false },
              stringField('label', 'Parent label'),
            ],
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await collections.create({
          values: {
            name: 'dogs',
            hidden: false,
            inherits: ['animals'],
            fields: [stringField('bark', 'Local bark')],
          },
        })
      ).status,
    ).toBe(200);
    // Set a display override after the physical column has already been inherited.
    expect(
      (await agent.resource('collections.fields', 'dogs').create({ values: stringField('label', 'Dog label') })).status,
    ).toBe(200);
    expect(
      (
        await collections.create({
          values: {
            name: 'puppies',
            schema: 'kennel',
            tableName: 'dogs',
            hidden: false,
            inherits: ['dogs'],
          },
        })
      ).status,
    ).toBe(200);

    const dogs = db.getCollection('dogs');
    const puppies = db.getCollection('puppies');
    const puppy = await puppies.repository.create({ values: { title: 'Rex', label: 'Friendly', bark: 'Woof' } });
    await db.sequelize
      .getQueryInterface()
      .addColumn(puppies.getTableNameWithSchema(), 'microchip', { type: DataTypes.STRING });
    const ownFields = (collectionName: string) => fields.find({ filter: { collectionName }, sort: ['name'] });
    const beforeOverride = await fields.findOne({ filter: { collectionName: 'dogs', name: 'label' } });
    expect(beforeOverride.get('overriding')).toBe(true);

    for (let pass = 0; pass < 2; pass++) {
      expect(
        (await agent.resource('mainDataSource').syncFields({ values: { collections: ['dogs', 'puppies'] } })).status,
      ).toBe(200);
      const dogFields = await ownFields('dogs');
      expect(dogFields.map((field) => field.get('name'))).toEqual(['bark', 'id', 'label']);
      expect(dogFields[0].get('uiSchema').title).toBe('Local bark');
      expect(dogFields[2].get('key')).toBe(beforeOverride.get('key'));
      expect(dogFields[2].get('overriding')).toBe(true);
      expect(dogFields[2].toJSON()).toEqual(beforeOverride.toJSON());
      expect((await ownFields('puppies')).map((field) => field.get('name'))).toEqual(['id', 'microchip']);
    }

    for (const name of ['title', 'label']) {
      expect(
        (
          await agent.resource('collections.fields', 'animals').update({
            filterByTk: name,
            values: { uiSchema: { title: 'Updated ' + name } },
          })
        ).status,
      ).toBe(200);
      expect(db.getCollection('animals').getField(name).options.uiSchema.title).toBe('Updated ' + name);
    }
    for (const collection of [dogs, puppies]) {
      expect(collection.getField('title').options.uiSchema.title).toBe('Updated title');
      expect(collection.getField('label').options.uiSchema.title).toBe('Dog label');
    }
    await expect(puppies.repository.create({ values: { title: null } })).rejects.toThrow(/notNull|null value/i);
    expect((await puppies.repository.findOne({ filterByTk: puppy.get('id') })).toJSON()).toMatchObject({
      title: 'Rex',
      label: 'Friendly',
      bark: 'Woof',
    });
  });

  it('keeps a shared column inherited from two parents during a full sync', async () => {
    const { db } = app;
    const collections = db.getRepository('collections');
    for (const name of ['cats', 'pets']) {
      await collections.create({
        values: {
          name,
          hidden: false,
          timestamps: false,
          autoGenId: false,
          fields: [{ type: 'string', name: 'tag', field: 'tag_code', uiSchema: { title: 'Common tag' } }],
        },
        context: {},
      });
    }
    await collections.create({
      values: {
        name: 'houseCats',
        hidden: false,
        timestamps: false,
        autoGenId: false,
        inherits: ['cats', 'pets'],
        fields: [{ type: 'string', name: 'nickname' }],
      },
      context: {},
    });
    const fields = db.getRepository('fields');
    for (let pass = 0; pass < 2; pass++) {
      expect((await app.agent().resource('mainDataSource').syncFields()).status).toBe(200);
      const rows = await fields.find({ filter: { collectionName: 'houseCats' } });
      expect(rows.map((row) => row.get('name'))).toEqual(['nickname']);
      expect(db.getCollection('houseCats').getField('tag').options.uiSchema.title).toBe('Common tag');
    }
  });
});
