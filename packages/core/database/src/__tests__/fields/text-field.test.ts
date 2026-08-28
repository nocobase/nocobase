/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('text field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create text field type', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'text',
          name: 'text1',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text2',
          length: 'tiny',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text3',
          length: 'medium',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text4',
          length: 'long',
          defaultValue: 'a',
        },
      ],
    });
    await Test.sync();
  });

  it('trim', async () => {
    const collection = db.collection({
      name: 'tests',
      fields: [{ type: 'text', name: 'name', trim: true }],
    });
    await db.sync();
    const model = await collection.model.create({
      name: '  n1\n ',
    });
    expect(model.get('name')).toBe('n1');
  });

  it('trim when value is null should be null', async () => {
    const collection = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name', trim: true }],
    });
    await db.sync();
    const model = await collection.model.create({
      name: null,
    });
    expect(model.get('name')).toBeFalsy();
  });

  it('when value is number should be convert to string', async () => {
    const collection = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name', trim: true }],
    });
    await db.sync();
    const model = await collection.model.create({
      name: 123,
    });
    expect(model.get('name')).toBe('123');
  });

  it('sanitizes rich text on create, bulk create, and bulk update', async () => {
    const collection = db.collection({
      name: 'rich_text_tests',
      fields: [{ type: 'text', name: 'content', interface: 'richText' }],
    });
    await db.sync();

    const created = await collection.repository.create({
      values: { content: '<p>safe</p><img src=x onerror="alert(1)">' },
    });
    expect(created.get('content')).toBe('<p>safe</p><img src="x" />');

    const bulkCreated = await collection.model.bulkCreate([
      { content: '<strong>safe</strong><script>alert(1)</script>' },
    ]);
    expect(bulkCreated[0].get('content')).toBe('<strong>safe</strong>');

    await collection.model.update(
      { content: '<a href="javascript:alert(1)">unsafe</a>' },
      { where: { id: created.get('id') } },
    );
    const updated = await collection.repository.findOne({ filterByTk: created.get('id') });
    expect(updated.get('content')).toBe('<a>unsafe</a>');
  });

  it('does not sanitize ordinary text fields', async () => {
    const collection = db.collection({
      name: 'ordinary_text_tests',
      fields: [{ type: 'text', name: 'content' }],
    });
    await db.sync();

    const model = await collection.model.create({ content: '<img src=x onerror="alert(1)">' });
    expect(model.get('content')).toBe('<img src=x onerror="alert(1)">');
  });

  it('sanitizes string values in JSON-backed rich text fields', async () => {
    const collection = db.collection({
      name: 'json_rich_text_tests',
      fields: [{ type: 'json', name: 'content', interface: 'richText' }],
    });
    await db.sync();

    const model = await collection.repository.create({
      values: { content: '<p>safe</p><img src=x onerror="alert(1)">' },
    });
    expect(model.get('content')).toBe('<p>safe</p><img src="x" />');
  });
});
