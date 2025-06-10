/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayFieldRepository, Database, createMockDatabase } from '@nocobase/database';

describe('Array field repository', () => {
  let db: Database;

  let TestCollection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    TestCollection = db.collection({
      name: 'test',
      fields: [
        {
          type: 'set',
          name: 'set-field',
        },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should add item into fields', async () => {
    const a1 = await TestCollection.repository.create({});

    const fieldRepository = new ArrayFieldRepository(TestCollection, 'set-field', a1.get('id'));
    await fieldRepository.add({
      values: 'a',
    });

    expect(await fieldRepository.get()).toEqual(['a']);
  });

  it('should remove item', async () => {
    const a1 = await TestCollection.repository.create({});

    const fieldRepository = new ArrayFieldRepository(TestCollection, 'set-field', a1.get('id'));
    await fieldRepository.add({
      values: ['a', 'b', 'c'],
    });

    expect(await fieldRepository.get()).toEqual(['a', 'b', 'c']);
    await fieldRepository.remove({
      values: ['c'],
    });

    expect(await fieldRepository.get()).toEqual(['a', 'b']);
  });

  it('should set items', async () => {
    const a1 = await TestCollection.repository.create({});

    const fieldRepository = new ArrayFieldRepository(TestCollection, 'set-field', a1.get('id'));
    await fieldRepository.add({
      values: ['a', 'b', 'c'],
    });

    expect(await fieldRepository.get()).toEqual(['a', 'b', 'c']);
    await fieldRepository.set({
      values: ['d', 'e'],
    });

    expect(await fieldRepository.get()).toEqual(['d', 'e']);
  });

  it('should toggle item', async () => {
    const a1 = await TestCollection.repository.create({});

    const fieldRepository = new ArrayFieldRepository(TestCollection, 'set-field', a1.get('id'));
    await fieldRepository.add({
      values: ['a', 'b', 'c'],
    });

    expect(await fieldRepository.get()).toEqual(['a', 'b', 'c']);

    await fieldRepository.toggle({
      value: 'c',
    });

    expect(await fieldRepository.get()).toEqual(['a', 'b']);

    await fieldRepository.toggle({
      value: 'c',
    });

    expect(await fieldRepository.get()).toEqual(['a', 'b', 'c']);
  });
});
