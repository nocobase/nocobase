/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database, updateAssociations } from '@nocobase/database';

describe('update associations', () => {
  describe('belongsTo', () => {
    let db: Database;
    beforeEach(async () => {
      db = await createMockDatabase({});
      await db.clean({
        drop: true,
      });
    });

    afterEach(async () => {
      await db.close();
    });

    it('should update has one association with foreign key', async () => {
      const User = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasOne', name: 'profile', foreignKey: 'userId', target: 'profiles' },
        ],
      });

      const Profile = db.collection({
        name: 'profiles',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'bigInt', name: 'userId' },
          { type: 'belongsTo', name: 'user', foreignKey: 'userId' },
        ],
      });

      await db.sync();

      // create user
      const user = await User.repository.create({ values: { name: 'user1' } });
      const profile = await Profile.repository.create({ values: { name: 'profile1' } });

      const profileData = profile.toJSON();
      await User.repository.update({
        filterByTk: user.id,
        values: {
          profile: {
            ...profileData,
            userId: null,
          },
        },
        updateAssociationValues: ['profile'],
      });

      const profile1 = await Profile.repository.findOne({ filterByTk: profile.id });
      assert.equal(profile1['userId'], user.id);
    });

    it('should update has many association with foreign key', async () => {
      const User = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'profiles', foreignKey: 'userId', target: 'profiles' },
        ],
      });

      const Profile = db.collection({
        name: 'profiles',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'bigInt', name: 'userId' },
          { type: 'belongsTo', name: 'user', foreignKey: 'userId' },
        ],
      });

      await db.sync();

      // create user
      const user = await User.repository.create({ values: { name: 'user1' } });
      const profile = await Profile.repository.create({ values: { name: 'profile1' } });

      const profileData = profile.toJSON();
      await User.repository.update({
        filterByTk: user.id,
        values: {
          profiles: [
            {
              ...profileData,
              userId: null,
            },
          ],
        },
        updateAssociationValues: ['profiles'],
      });

      const profile1 = await Profile.repository.findOne({ filterByTk: profile.id });
      assert.equal(profile1['userId'], user.id);
    });

    test('update belongs to with foreign key and object', async () => {
      const throughAB = db.collection({
        name: 'throughAB',
        fields: [
          {
            type: 'belongsTo',
            name: 'b',
            foreignKey: 'bId',
            target: 'B',
          },
        ],
      });

      const throughBC = db.collection({
        name: 'throughBC',
        fields: [
          {
            type: 'belongsTo',
            name: 'c',
            foreignKey: 'cId',
            target: 'C',
          },
        ],
      });

      const throughCD = db.collection({
        name: 'throughCD',
        fields: [
          {
            type: 'belongsTo',
            name: 'd',
            foreignKey: 'dId',
            target: 'D',
          },
        ],
      });

      const A = db.collection({
        name: 'A',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'throughAB', foreignKey: 'aId', target: 'throughAB' },
        ],
      });

      const B = db.collection({
        name: 'B',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'throughBC', foreignKey: 'bId', target: 'throughBC' },
        ],
      });

      const C = db.collection({
        name: 'C',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'hasMany',
            name: 'throughCD',
            foreignKey: 'cId',
            target: 'throughCD',
          },
        ],
      });

      const D = db.collection({
        name: 'D',
        fields: [{ type: 'string', name: 'name' }],
      });

      await db.sync();

      const a1 = await A.repository.create({
        values: {
          name: 'a1',
          throughAB: [
            {
              b: {
                name: 'b1',
                throughBC: [
                  {
                    c: {
                      name: 'c1',
                      throughCD: [
                        {
                          d: {
                            name: 'd1',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      });

      expect(
        a1.get('throughAB')[0].get('b').get('throughBC')[0].get('c').get('throughCD')[0].get('d').get('name'),
      ).toBe('d1');
    });

    it('post.user', async () => {
      const User = db.collection<{ id: string; name: string }, { name: string }>({
        name: 'users',
        fields: [{ type: 'string', name: 'name' }],
      });

      const Post = db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'belongsTo', name: 'user' },
        ],
      });

      await db.sync();

      const user = await User.model.create({ name: 'user1' });
      const post1 = await Post.model.create({ name: 'post1' });

      await updateAssociations(post1, {
        user,
      });

      expect(post1.toJSON()).toMatchObject({
        id: 1,
        name: 'post1',
        userId: 1,
        user: {
          id: 1,
          name: 'user1',
        },
      });

      const post2 = await Post.model.create({ name: 'post2' });
      await updateAssociations(post2, {
        user: user.getDataValue('id'),
      });

      expect(post2.toJSON()).toMatchObject({
        id: 2,
        name: 'post2',
        userId: 1,
      });

      const post3 = await Post.model.create({ name: 'post3' });
      await updateAssociations(post3, {
        user: {
          name: 'user3',
        },
      });

      expect(post3.toJSON()).toMatchObject({
        id: 3,
        name: 'post3',
        userId: 2,
        user: {
          id: 2,
          name: 'user3',
        },
      });

      const post4 = await Post.model.create({ name: 'post4' });
      await updateAssociations(post4, {
        user: {
          id: user.getDataValue('id'),
          name: 'user4',
        },
      });

      const p4 = await db.getRepository('posts').findOne({
        filterByTk: post4.id,
        appends: ['user'],
      });

      expect(p4?.toJSON()).toMatchObject({
        name: 'post4',
        user: {
          name: 'user1',
        },
      });
      assert.equal(p4?.get('id'), 4);
      assert.equal(p4?.get('user').id, 1);
      assert.equal(p4?.get('userId'), 1);
    });
  });

  describe('hasMany', () => {
    let db: Database;
    let User: Collection;
    let Post: Collection;
    beforeEach(async () => {
      db = await createMockDatabase();
      await db.clean({ drop: true });
      User = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'posts' },
        ],
      });
      Post = db.collection({
        name: 'posts',
        fields: [{ type: 'string', name: 'name' }],
      });
      await db.sync();
    });
    afterEach(async () => {
      await db.close();
    });

    it('should update association values', async () => {
      const user1 = await User.repository.create({
        values: {
          name: 'u1',
          posts: [{ name: 'u1t1' }],
        },
      });

      // update with associations
      const updateRes = await User.repository.update({
        filterByTk: user1.get('id'),
        values: {
          name: 'u1',
          posts: [{ id: user1.get('posts')[0].get('id'), name: 'u1t1' }],
        },
        updateAssociationValues: ['comments'],
      });

      expect(updateRes[0].toJSON()['posts'].length).toBe(1);
    });

    it('user.posts', async () => {
      await User.model.create<any>({ name: 'user01' });
      await User.model.create<any>({ name: 'user02' });
      const user1 = await User.model.create<any>({ name: 'user1' });
      await updateAssociations(user1, {
        posts: {
          name: 'post1',
        },
      });
      expect(user1.toJSON()).toMatchObject({
        name: 'user1',
        posts: [
          {
            name: 'post1',
          },
        ],
      });
      assert.equal(user1.get('posts')[0].get('userId'), user1.id);
    });
    it('user.posts', async () => {
      const user1 = await User.model.create<any>({ name: 'user1' });
      await updateAssociations(user1, {
        posts: [
          {
            name: 'post1',
          },
        ],
      });
      expect(user1.toJSON()).toMatchObject({
        name: 'user1',
        posts: [
          {
            name: 'post1',
          },
        ],
      });
      assert.equal(user1.get('posts')[0].get('userId'), user1.id);
    });
    it('user.posts', async () => {
      const user1 = await User.model.create<any>({ name: 'user1' });
      const post1 = await Post.model.create<any>({ name: 'post1' });
      await updateAssociations(user1, {
        posts: post1.id,
      });
      expect(user1.toJSON()).toMatchObject({
        name: 'user1',
      });
      const post11 = await Post.model.findByPk(post1.id);
      assert.equal(post11.get('userId'), user1.id);
    });
    it('user.posts', async () => {
      const user1 = await User.model.create<any>({ name: 'user1' });
      const post1 = await Post.model.create<any>({ name: 'post1' });
      await updateAssociations(user1, {
        posts: post1,
      });

      expect(user1.toJSON()).toMatchObject({
        name: 'user1',
      });
      const post11 = await Post.model.findByPk(post1.id);
      assert.equal(post11.get('userId'), user1.id);
    });
    it('user.posts', async () => {
      const user1 = await User.model.create<any>({ name: 'user1' });
      const post1 = await Post.model.create<any>({ name: 'post1' });
      await updateAssociations(user1, {
        posts: {
          id: post1.id,
          name: 'post111',
        },
      });

      expect(user1.toJSON()).toMatchObject({
        name: 'user1',
      });
      const post11 = await Post.model.findByPk(post1.id);
      assert.equal(post11.get('userId'), user1.id);
      assert.equal(post11.get('name'), 'post1');
    });
    it('user.posts', async () => {
      const user1 = await User.model.create<any>({ name: 'user1' });
      const post1 = await Post.model.create<any>({ name: 'post1' });
      const post2 = await Post.model.create<any>({ name: 'post2' });
      const post3 = await Post.model.create<any>({ name: 'post3' });
      await updateAssociations(user1, {
        posts: [
          {
            id: post1.id,
            name: 'post111',
          },
          post2.id,
          post3,
        ],
      });

      expect(user1.toJSON()).toMatchObject({
        name: 'user1',
      });
      const post11 = await Post.model.findByPk(post1.id);
      assert.equal(post11.get('userId'), user1.id);
      assert.equal(post11.get('name'), 'post1');
      const post22 = await Post.model.findByPk(post2.id);
      assert.equal(post22.get('userId'), user1.id);
      assert.equal(post22.get('name'), 'post2');
      const post33 = await Post.model.findByPk(post3.id);
      assert.equal(post33.get('userId'), user1.id);
      assert.equal(post33.get('name'), 'post3');
    });
  });

  describe('nested', () => {
    let db: Database;
    let User: Collection;
    let Post: Collection;
    let Comment: Collection;

    beforeEach(async () => {
      db = await createMockDatabase();
      await db.clean({ drop: true });
      User = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'posts' },
        ],
      });
      Post = db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'belongsTo', name: 'user' },
          { type: 'hasMany', name: 'comments' },
        ],
      });
      Comment = db.collection({
        name: 'comments',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'belongsTo', name: 'post' },
        ],
      });
      await db.sync();
    });

    afterEach(async () => {
      await db.close();
    });

    test('create many with nested associations', async () => {
      await User.repository.createMany({
        records: [
          {
            name: 'u1',
            posts: [
              {
                name: 'u1p1',
                comments: [
                  {
                    name: 'u1p1c1',
                  },
                ],
              },
            ],
          },
          {
            name: 'u2',
            posts: [
              {
                name: 'u2p1',
                comments: [
                  {
                    name: 'u2p1c1',
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it('nested', async () => {
      const user = await User.model.create({ name: 'user1' });
      await updateAssociations(user, {
        posts: [
          {
            name: 'post1',
            comments: [
              {
                name: 'comment1',
              },
              {
                name: 'comment12',
              },
            ],
          },
          {
            name: 'post2',
            comments: [
              {
                name: 'comment21',
              },
              {
                name: 'comment22',
              },
            ],
          },
        ],
      });

      const post1 = await Post.model.findOne({
        where: { name: 'post1' },
      });

      assert.equal(post1.get('userId'), user.id);

      const comment1 = await Comment.model.findOne({
        where: { name: 'comment1' },
      });

      assert.equal(comment1.get('postId'), post1.get('id'));
    });
  });

  describe('belongsToMany', () => {
    let db: Database;
    let Post: Collection;
    let Tag: Collection;
    let PostTag: Collection;

    beforeEach(async () => {
      db = await createMockDatabase();
      await db.clean({ drop: true });
      PostTag = db.collection({
        name: 'posts_tags',
        fields: [{ type: 'string', name: 'tagged_at' }],
      });
      Post = db.collection({
        name: 'posts',
        fields: [
          { type: 'belongsToMany', name: 'tags', through: 'posts_tags' },
          { type: 'string', name: 'title' },
        ],
      });

      Tag = db.collection({
        name: 'tags',
        fields: [
          { type: 'belongsToMany', name: 'posts', through: 'posts_tags' },
          { type: 'string', name: 'name' },
        ],
      });

      await db.sync();
    });

    afterEach(async () => {
      await db.close();
    });
    test('set through value', async () => {
      const p1 = await Post.repository.create({
        values: {
          title: 'hello',
          tags: [
            {
              name: 't1',
              posts_tags: {
                tagged_at: '123',
              },
            },
            { name: 't2' },
          ],
        },
      });
      const count = await PostTag.repository.count({
        filter: {
          tagged_at: '123',
        },
      });
      expect(count).toEqual(1);
    });

    test('should update belongsToMany association not throw error when relation table field is uuid', async () => {
      const TeacherStudent = db.collection({
        name: 'teacher_student',
        fields: [{ type: 'uuid', name: 'uid', primaryKey: true, autoGenId: true }],
      });
      const Student = db.collection({
        name: 'students',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'belongsToMany',
            name: 'teachers',
            through: 'teacher_student',
          },
        ],
      });
      const Teacher = db.collection({
        name: 'teachers',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'belongsToMany',
            name: 'students',
            through: 'teacher_student',
          },
        ],
      });
      await db.sync();

      const student = await Student.repository.create({
        values: { name: 'student1' },
      });
      const teacher = await Teacher.repository.create({
        values: {
          name: 'teacher1',
          students: [{ id: student.id }],
        },
      });
      assert.ok(teacher);
    });

    test('should update belongsToMany association not throw error when relation table field is nanoid', async () => {
      const TeacherStudent = db.collection({
        name: 'teacher_student',
        fields: [{ type: 'nanoid', name: 'uid', primaryKey: true, autoGenId: true }],
      });
      const Student = db.collection({
        name: 'students',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'belongsToMany',
            name: 'teachers',
            through: 'teacher_student',
          },
        ],
      });
      const Teacher = db.collection({
        name: 'teachers',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'belongsToMany',
            name: 'students',
            through: 'teacher_student',
          },
        ],
      });
      await db.sync();

      const student = await Student.repository.create({
        values: { name: 'student1' },
      });
      const teacher = await Teacher.repository.create({
        values: {
          name: 'teacher1',
          students: [{ id: student.id }],
        },
      });
      assert.ok(teacher);
    });
  });
});
