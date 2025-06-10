/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('association target key', async () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('belongs to many', async () => {
    let Post;
    let Tag;
    beforeEach(async () => {
      Post = db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'string', name: 'content' },
          {
            type: 'belongsToMany',
            name: 'tags',
            target: 'tags',
            through: 'posts_tags',
            sourceKey: 'id',
            foreignKey: 'post_id',
            otherKey: 'tag_name',
            targetKey: 'name',
          },
        ],
      });

      Tag = db.collection({
        name: 'tags',
        fields: [{ type: 'string', name: 'name', unique: true }],
      });

      await db.sync({
        force: true,
      });
    });

    it('should set with association', async () => {
      await Post.repository.create({
        values: {
          title: 'post1',
          tags: [{ name: 'tag1' }, { name: 'tag2' }],
        },
      });

      const post1 = await Post.repository.findOne({
        filter: {
          title: 'post1',
        },
        appends: ['tags'],
      });

      expect(post1.tags.length).toBe(2);
    });

    it('should create with association', async () => {
      await Tag.repository.create({
        values: [
          {
            name: 'tag1',
          },
          {
            name: 'tag2',
          },
        ],
      });

      await Post.repository.create({
        values: {
          title: 'post1',
          tags: [{ name: 'tag1' }, { name: 'tag2' }],
        },
      });

      const post1 = await Post.repository.findOne({
        filter: {
          title: 'post1',
        },
        appends: ['tags'],
      });

      expect(post1.tags.length).toBe(2);
    });
  });
});
