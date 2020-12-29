import { Op } from 'sequelize';
import Database from '../../database';
import { toWhere } from '../../utils';
import { getDatabase } from '..';

describe('utils.toWhere', () => {
  let db: Database;

  beforeEach(async () => {
    db = getDatabase();

    db.table({
      name: 'users',
      fields: [
        {
          type: 'hasMany',
          name: 'posts',
        }
      ],
    });
    db.table({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title'
        },
        {
          type: 'belongsTo',
          name: 'user',
        }
      ]
    });
    
    await db.sync({ force: true });

    const Post = db.getModel('posts');
    await Post.bulkCreate(Array(5).fill(null).map((_, i) => ({
      title: `title${i}`,
      created_at: new Date(2020, 11, 29 + i)
    })));
  });

  afterEach(async () => await db.close());

  describe('date', () => {
    it('$dateOn', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateOn': '2020-12-31'
        })
      });
      expect(posts[0].created_at).toEqual(new Date(2020, 11,31));
    });

    it('Op.$dateBefore', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateBefore': '2020-12-29'
        })
      });
      expect(posts.length).toBe(0);
    });

    it('Op.$dateBefore', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateBefore': '2021/1/2'
        })
      });
      expect(posts.length).toBe(4);
    });

    it('Op.$dateBefore', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateBefore': '2021/1/3'
        })
      });
      expect(posts.length).toBe(5);
    });

    it('Op.$dateAfter', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateAfter': '2021/1/3'
        })
      });
      expect(posts.length).toBe(0);
    });

    it('Op.$dateAfter', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateAfter': '2021-01-03'
        })
      });
      expect(posts.length).toBe(0);
    });

    it('Op.$dateAfter', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateAfter': '2020-12-29'
        })
      });
      expect(posts.length).toBe(4);
    });

    it('Op.$dateNotBefore', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateNotBefore': '2020-12-29'
        })
      });
      expect(posts.length).toBe(5);
    });

    it('Op.$dateNotAfter', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateNotAfter': '2020-12-29'
        })
      });
      expect(posts.length).toBe(1);
    });

    it('Op.$dateBetween', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateBetween': ['2020-12-29', '2021-01-01']
        })
      });
      expect(posts.length).toBe(4);
    });

    it('Op.$dateBetween', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateBetween': ['2020-12-28', '2020-12-29']
        })
      });
      expect(posts.length).toBe(1);
    });

    it('Op.$dateBetween', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: toWhere({
          'created_at.$dateBetween': ['2021-01-03', '2021-01-04']
        })
      });
      expect(posts.length).toBe(0);
    });
  });
});
