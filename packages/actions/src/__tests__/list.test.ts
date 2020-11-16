import { Op } from 'sequelize';

import { initDatabase, agent } from './index';

describe('list', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  describe('common', () => {
    beforeEach(async () => {
      const Post = db.getModel('posts');
      const items = [];
      for (let index = 0; index < 2; index++) {
        items.push({
          title: `title${index}`,
          status: index % 2 ? 'published' : 'draft'
        });
      }
      await Post.bulkCreate(items);
    });

    describe('filter', () => {
      describe('equal', () => {
        it('should be filtered by `status` equal to `published`', async () => {
          const Post = db.getModel('posts');
          const response = await agent.get('/posts?filter[status]=published');
          expect(response.body.count).toBe(await Post.count({ where: { status: 'published' } }));
        });
      
        it('should be filtered by `title` equal to `title1`', async () => {
          const Post = db.getModel('posts');
          const response = await agent.get('/posts?filter[title]=title1');
          expect(response.body.count).toBe(await Post.count({
            where: {
              title: 'title1',
            },
          }));
        });
      });

      describe('not equal', () => {
        it('filter[status][ne]=published', async () => {
          const Post = db.getModel('posts');
          const drafts = (await Post.findAll({
            where: {
              status: {
                [Op.ne]: 'published'
              }
            }
          })).map(item => item.get('title'));
          const response = await agent.get('/posts?filter[status][ne]=published');
          expect(response.body.count).toBe(drafts.length);
          expect(response.body.rows[0].title).toBe(drafts[0]);
        });
      });
    });

    describe('page', () => {
      it('page by default size(20) should be ok', async () => {
        const response = await agent.get('/posts?fields=title&page=1');
        expect(response.body).toEqual({
          count: 2,
          page: 1,
          per_page: 20,
          rows: [ { title: 'title0' }, { title: 'title1' } ],
        });
      });
    
      it('page 1 by size(1) should be ok', async () => {
        const response = await agent.get('/posts?fields=title&page=2&perPage=1');
        expect(response.body).toEqual({
          count: 2,
          page: 2,
          per_page: 1,
          rows: [ { title: 'title1' } ],
        });
      });
    
      it('page 2 by size(1) should be ok', async () => {
        const response = await agent.get('/posts?fields=title&page=2&per_page=1');
        expect(response.body).toEqual({
          count: 2,
          page: 2,
          per_page: 1,
          rows: [ { title: 'title1' } ],
        });
      });
    });
  
    it('list6', async () => {
      const response = await agent.get('/posts?fields=title&filter[customTitle]=title0');
      expect(response.body).toEqual({ count: 1, rows: [ { title: 'title0' } ] });
    });
  });

  describe('hasMany', () => {
    it('list1', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        comments: [
          {content: 'content1', status: 'published'},
          {content: 'content2', status: 'published'},
          {content: 'content3', status: 'draft'},
          {content: 'content4', status: 'published'},
          {content: 'content5', status: 'draft'},
          {content: 'content6', status: 'published'},
        ],
      });
      const response = await agent
        .get(`/posts/${post.id}/comments?page=2&perPage=2&sort=content&fields=content&filter[published]=1`);
      expect(response.body).toEqual({
        rows: [ { content: 'content4' }, { content: 'content6' } ],
        count: 4,
        page: 2,
        per_page: 2
      });
    });
  });

  describe('belongsToMany', () => {
    it('list1', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        tags: [
          {name: 'tag1', status: 'published'},
          {name: 'tag2', status: 'draft'},
          {name: 'tag3', status: 'published'},
          {name: 'tag4', status: 'draft'},
          {name: 'tag5', status: 'published'},
          {name: 'tag6', status: 'draft'},
          {name: 'tag7', status: 'published'},
        ],
      });
      const response = await agent
        .get(`/posts/${post.id}/tags?page=2&perPage=2&sort=name&fields=name&filter[published]=1`);
      expect(response.body).toEqual({
        rows: [ { name: 'tag5' }, { name: 'tag7' } ],
        count: 4,
        page: 2,
        per_page: 2
      });
    });
  });

});
