import { mockServer } from './index';
import { SortAbleCollection } from '../actions';
import lodash from 'lodash';

describe('sort collections', () => {
  let app;
  let Post;

  beforeEach(async () => {
    app = mockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('sort collection', () => {
    beforeEach(async () => {
      Post = app.db.collection({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'sort',
            name: 'sort',
          },
        ],
      });

      await app.db.sync();

      for (let i = 0; i < 5; i++) {
        await Post.repository.create({
          values: {
            title: `t${i + 1}`,
          },
        });
      }
    });

    test('forward insert', async () => {
      const t2 = await Post.repository.findOne({
        filter: {
          title: 't2',
        },
      });

      const t4 = await Post.repository.findOne({
        filter: {
          title: 't4',
        },
      });
      const sortCollection = new SortAbleCollection(Post);

      await sortCollection.move(t2.get('id'), t4.get('id'));

      const results = (
        await Post.repository.find({
          sort: ['sort'],
        })
      ).map((r) => {
        return lodash.pick(r.toJSON(), ['title', 'sort']);
      });

      expect(results).toEqual([
        { title: 't1', sort: 1 },
        { title: 't3', sort: 2 },
        { title: 't4', sort: 3 },
        { title: 't2', sort: 4 },
        { title: 't5', sort: 5 },
      ]);
    });

    test('backward insert', async () => {
      const t2 = await Post.repository.findOne({
        filter: {
          title: 't2',
        },
      });

      const t4 = await Post.repository.findOne({
        filter: {
          title: 't4',
        },
      });
      const sortCollection = new SortAbleCollection(Post);

      await sortCollection.move(t4.get('id'), t2.get('id'));

      const results = (
        await Post.repository.find({
          sort: ['sort'],
        })
      ).map((r) => {
        return lodash.pick(r.toJSON(), ['title', 'sort']);
      });

      expect(results).toEqual([
        { title: 't1', sort: 1 },
        { title: 't4', sort: 2 },
        { title: 't2', sort: 3 },
        { title: 't3', sort: 4 },
        { title: 't5', sort: 5 },
      ]);
    });
  });

  describe('two scope move', () => {
    beforeEach(async () => {
      Post = app.db.collection({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'sort',
            name: 'sort',
            scopeKey: 'status',
          },

          {
            type: 'string',
            name: 'status',
          },
        ],
      });

      await app.db.sync();
    });

    test('move in scope', async () => {
      for (let i = 0; i < 5; i++) {
        await Post.repository.create({
          values: {
            title: `s1:t${i + 1}`,
            status: 'status1',
          },
        });
      }

      for (let i = 0; i < 5; i++) {
        await Post.repository.create({
          values: {
            title: `s2:t${i + 1}`,
            status: 'status2',
          },
        });
      }

      const s1t2 = await Post.repository.findOne({
        filter: {
          title: 's1:t2',
        },
      });

      const s1t4 = await Post.repository.findOne({
        filter: {
          title: 's1:t4',
        },
      });

      const sortCollection = new SortAbleCollection(Post);
      await sortCollection.move(s1t2.get('id'), s1t4.get('id'));
      const results = (
        await Post.repository.find({
          sort: ['sort'],
          filter: {
            status: 'status1',
          },
        })
      ).map((r) => {
        return lodash.pick(r.toJSON(), ['title', 'sort']);
      });

      expect(results).toEqual([
        { title: 's1:t1', sort: 1 },
        { title: 's1:t3', sort: 2 },
        { title: 's1:t4', sort: 3 },
        { title: 's1:t2', sort: 4 },
        { title: 's1:t5', sort: 5 },
      ]);

      const s2results = (
        await Post.repository.find({
          sort: ['sort'],
          filter: {
            status: 'status2',
          },
        })
      ).map((r) => {
        return lodash.pick(r.toJSON(), ['title', 'sort']);
      });

      expect(s2results).toEqual([
        { title: 's2:t1', sort: 1 },
        { title: 's2:t2', sort: 2 },
        { title: 's2:t3', sort: 3 },
        { title: 's2:t4', sort: 4 },
        { title: 's2:t5', sort: 5 },
      ]);
    });

    test('move between scope', async () => {
      for (let i = 0; i < 5; i++) {
        await Post.repository.create({
          values: {
            title: `s1:t${i + 1}`,
            status: 'status1',
          },
        });
      }

      for (let i = 0; i < 5; i++) {
        await Post.repository.create({
          values: {
            title: `s2:t${i + 1}`,
            status: 'status2',
          },
        });
      }

      const s1t1 = await Post.repository.findOne({
        filter: {
          title: 's1:t1',
        },
      });

      const s2t3 = await Post.repository.findOne({
        filter: {
          title: 's2:t3',
        },
      });

      const sortCollection = new SortAbleCollection(Post);

      await sortCollection.move(s1t1.get('id'), s2t3.get('id'));

      const results = (
        await Post.repository.find({
          sort: ['sort'],
          filter: {
            status: 'status2',
          },
        })
      ).map((r) => {
        return lodash.pick(r.toJSON(), ['title', 'sort']);
      });

      expect(results).toEqual([
        { title: 's2:t1', sort: 1 },
        { title: 's2:t2', sort: 2 },
        { title: 's1:t1', sort: 3 },
        { title: 's2:t3', sort: 4 },
        { title: 's2:t4', sort: 5 },
        { title: 's2:t5', sort: 6 },
      ]);
    });
  });
});
