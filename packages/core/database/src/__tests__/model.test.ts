import { Database, mockDatabase } from '@nocobase/database';

describe('model', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should lazy load get association field value', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'profile' },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'integer', name: 'age' },
        { type: 'belongsTo', name: 'user' },
        { type: 'hasOne', name: 'sub_profile' },
      ],
    });

    const SubProfile = db.collection({
      name: 'sub_profiles',
      fields: [
        { type: 'string', name: 'family_name' },
        { type: 'belongsTo', name: 'profile' },
        { type: 'hasMany', name: 'comments' }, // use comments as hasOne
      ],
    });

    const Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'sub_profile' },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: {
        name: 'u1',
        profile: {
          age: 18,
          sub_profile: {
            family_name: 'f1',
            comments: [{ content: 'c1' }],
          },
        },
      },
    });

    const user = await User.repository.findOne({});

    const familyName = await user.lazyLoadGet('profile.sub_profile.family_name');
    expect(familyName).toBe('f1');

    expect(await user.lazyLoadGet('profile.sub_profile.comments.content')).toEqual('c1');
  });

  describe('toJSON', () => {
    it('should return null when belongsTo association empty', async () => {
      const user = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'posts' },
        ],
      });

      const posts = db.collection({
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

      const u1 = await db.getRepository('users').create({
        values: {
          name: 'u1',
        },
      });

      await db.getRepository('posts').create({
        values: {
          title: 'p1',
        },
      });

      const p1 = await db.getRepository('posts').findOne({
        appends: ['user'],
      });

      const p1JSON = p1.toJSON();
      expect(p1JSON['user']).toBeNull();
    });
  });
});
