/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database } from '@nocobase/database';
import { randomStr } from '@nocobase/test';
import { uid } from '@nocobase/utils';

describe('create with hasMany', () => {
  let db: Database;
  let Post: Collection;
  let User: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();

    await db.clean({ drop: true });
    User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    await db.sync();
  });

  it('should save associations with reverseField value', async () => {
    const u1 = await db.getRepository('users').create({
      updateAssociationValues: ['posts'],
      values: {
        name: 'u1',
        posts: [{ title: 't1', user: null }],
      },
    });

    const p1 = await db.getRepository('posts').findOne();
    // @ts-ignore
    expect(await p1.getUser()).not.toBeNull();
  });
});

describe('create with belongsToMany', () => {
  let db: Database;
  let Post: Collection;
  let Tag: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'posts',
        },
      ],
    });

    await db.sync();
  });

  it('should save associations with reverseField value', async () => {
    const t1 = await db.getRepository('tags').create({
      values: {
        name: 't1',
      },
    });

    const p1 = await db.getRepository('posts').create({
      values: {
        title: 'p1',
        tags: [{ id: t1.get('id'), name: 't1', posts: [] }],
      },
    });

    // @ts-ignore
    expect(await p1.countTags()).toEqual(1);
  });
});

describe('create', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Group: Collection;
  let Role: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    Group = db.collection({
      name: 'groups',
      fields: [{ type: 'string', name: 'name' }],
    });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
        { type: 'belongsTo', name: 'group' },
        { type: 'belongsToMany', name: 'roles' },
      ],
    });

    Role = db.collection({
      name: 'roles',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'users' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('firstOrCreate by filterKeys', async () => {
    const u1 = await User.repository.firstOrCreate({
      filterKeys: ['name'],
      updateAssociationValues: ['group'],
      values: {
        name: 'u1',
        age: 10,
        group: {
          name: 'g1',
        },
      },
    });

    expect(u1.name).toEqual('u1');

    const group = await u1.get('group');

    expect(group.name).toEqual('g1');

    const u2 = await User.repository.firstOrCreate({
      filterKeys: ['group'],
      values: {
        group: {
          name: 'g1',
        },
      },
    });

    expect(u2.name).toEqual('u1');
  });

  test('firstOrCreate by many to many associations', async () => {
    const roles = await Role.repository.create({
      values: [{ name: 'r1' }, { name: 'r2' }],
    });

    const u1 = await User.repository.firstOrCreate({
      updateAssociationValues: ['roles'],
      values: {
        name: 'u1',
        roles: [{ name: 'r1' }, { name: 'r2' }],
      },
      filterKeys: ['roles.name'],
    });

    expect(u1.get('roles')).toHaveLength(2);

    const u1a = await User.repository.firstOrCreate({
      values: {
        name: 'u1',
        roles: [{ name: 'r1' }, { name: 'r2' }],
      },
      filterKeys: ['roles.name'],
    });

    expect(u1a.get('id')).toEqual(u1.get('id'));
  });

  test('firstOrCreate', async () => {
    const u1 = await User.repository.firstOrCreate({
      filterKeys: ['name'],
      values: {
        name: 'u1',
        age: 10,
      },
    });

    expect(u1.name).toEqual('u1');
    expect(u1.age).toEqual(10);

    expect(
      (
        await User.repository.firstOrCreate({
          filterKeys: ['name'],
          values: {
            name: 'u1',
            age: 10,
          },
        })
      ).get('id'),
    ).toEqual(u1.get('id'));
  });

  test('updateOrCreate', async () => {
    const u1 = await User.repository.updateOrCreate({
      filterKeys: ['name'],
      values: {
        name: 'u1',
        age: 10,
      },
    });

    expect(u1.name).toEqual('u1');
    expect(u1.age).toEqual(10);

    await User.repository.updateOrCreate({
      filterKeys: ['name'],
      values: {
        name: 'u1',
        age: 20,
      },
    });

    await u1.reload();
    expect(u1.age).toEqual(20);
  });

  test('create with association', async () => {
    const u1 = await User.repository.create({
      updateAssociationValues: ['posts'],
      values: {
        name: 'u1',
        posts: [{ title: 'u1p1' }],
      },
    });

    expect(u1.name).toEqual('u1');
    expect(await u1.countPosts()).toEqual(1);
  });
});

describe('validation', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('string field validation', () => {
    let StringCollection: Collection;
    beforeEach(async () => {
      StringCollection = db.collection({
        name: 'test',
        fields: [
          {
            type: 'string',
            name: 'name',
            allowNull: true,
            validation: {
              type: 'string',
              rules: [
                { key: `r_${uid()}`, name: 'required' },
                { key: `r_${uid()}`, name: 'min', args: { limit: 2 } },
                { key: `r_${uid()}`, name: 'max', args: { limit: 5 } },
                { key: `r_${uid()}`, name: 'pattern', args: { regex: /^[a-zA-Z]+$/ } }, // only letters
              ],
            },
          },
        ],
      });
      await db.sync();
    });

    it('should throw validation error for string field that is too short', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: 'a', // violates min: 2
          },
        }),
      ).rejects.toThrow();
    });

    it('should throw validation error for string field that is too long', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: 'abcdef', // violates max: 5
          },
        }),
      ).rejects.toThrow();
    });

    it('should throw validation error for invalid pattern', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: 'abc123', // violates pattern: only letters allowed
          },
        }),
      ).rejects.toThrow();
    });

    it('should succeed with valid string values', async () => {
      const result = await StringCollection.repository.create({
        values: {
          name: 'abc', // valid: length 2-5 and only letters
        },
      });

      expect(result.get('name')).toBe('abc');
    });

    it('should throw validation error for invalid null', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: null,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('association field validation', () => {
    let User: Collection;
    let Profile: Collection;
    beforeEach(async () => {
      User = db.collection({
        name: 'users',
        fields: [
          { type: 'hasOne', name: 'profile' },
          { type: 'belongsTo', name: 'group' },
          { type: 'string', name: 'name' },
        ],
      });

      Profile = db.collection({
        name: 'profiles',
        fields: [
          {
            type: 'string',
            name: 'avatar',
            validation: {
              type: 'string',
              rules: [{ key: `r_${uid()}`, name: 'length', args: { limit: 2 } }],
            },
          },
        ],
      });

      await db.sync();
    });

    it('should throw validation error for invalid avatar', async () => {
      await expect(
        User.repository.create({
          updateAssociationValues: ['profile'],
          values: {
            name: randomStr().slice(0, 2),
            profile: {
              avatar: 'avatar',
            },
          },
        }),
      ).rejects.toThrow();
    });
    it('should succeed with valid profile', async () => {
      const user = await User.repository.create({
        updateAssociationValues: ['profile'],
        values: {
          name: randomStr().slice(0, 2),
          profile: {
            avatar: 'av',
          },
        },
      });

      expect(await user.getProfile()).toMatchObject({ avatar: 'av' });
    });

    it('should succeed when creating user with existing profile', async () => {
      const profile = await Profile.model.create({
        avatar: 'avatar',
      });
      const user = await User.repository.create({
        values: {
          name: randomStr().slice(0, 2),
          profile: {
            id: profile.get('id'),
            avatar: 'avatar',
          },
        },
      });

      expect(await user.getProfile()).toMatchObject({ avatar: 'avatar' });
    });
  });
});
