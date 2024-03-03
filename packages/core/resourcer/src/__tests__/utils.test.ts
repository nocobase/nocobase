import { mergeFields, parseFields, parseQuery, parseRequest } from '..';

describe('utils', () => {
  describe('parseQuery', () => {
    it('filter support normal json type', () => {
      const object = {
        number: -1.1,
        string: 'str=a',
        boolean: true,
        null: null,
        array: [5],
        object: {
          member: {},
        },
        undefined: undefined,
      };
      const json = JSON.stringify(object);
      expect(parseQuery(`filter=${encodeURIComponent(json)}&sort=-col`)).toEqual({
        filter: object,
        sort: '-col',
      });
    });
  });

  describe('parseFields', () => {
    it('plain string fields equal to only', () => {
      expect(parseFields('name,age')).toMatchObject({
        only: ['name', 'age'],
      });
    });

    it('plain array fields equal to only', () => {
      expect(parseFields(['name', 'age'])).toMatchObject({
        only: ['name', 'age'],
      });
    });

    it('only string fields equal to only', () => {
      expect(parseFields({ only: 'name,age' })).toMatchObject({
        only: ['name', 'age'],
      });
    });

    it('only array fields equal to only', () => {
      expect(parseFields({ only: ['name', 'age'] })).toMatchObject({
        only: ['name', 'age'],
      });
    });

    it('plain only and expect fields', () => {
      // input as "fields=title&fields[only]=content&fields[except]=status&fields[except]=created_at"
      const result = parseFields(['title', { only: 'content' }, { except: ['status', 'created_at'] }]);
      expect(result).toMatchObject({
        only: ['title', 'content'],
        except: ['status', 'created_at'],
      });
    });
  });

  describe('mergeFields', () => {
    describe('empty default', () => {
      it('always contains "appends"', async () => {
        expect(mergeFields({}, { only: ['col'] })).toMatchObject({ appends: [], only: ['col'] });
      });

      it('appends', async () => {
        expect(mergeFields({}, { only: ['col1'], appends: ['col2'] })).toMatchObject({
          only: ['col1'],
          appends: ['col2'],
        });
      });
    });

    describe('options provided', () => {
      it('defaults provided: only, except, appends', () => {
        expect(
          mergeFields(
            {
              only: ['col1', 'col2'],
              except: ['col3'],
              appends: ['col4'],
            },
            {
              only: ['col1', 'col3', 'col4'],
              except: ['col5'],
              appends: ['col6'],
            },
          ),
        ).toMatchObject({
          only: ['col1'],
          appends: ['col6', 'col4'],
        });
      });
    });
  });

  describe('parseRequest', () => {
    it('index action', () => {
      const params = parseRequest({
        path: '/posts',
        method: 'GET',
      });
      expect(params).toMatchObject({ resourceName: 'posts', actionName: 'list' });
    });

    it('store action', () => {
      const params = parseRequest({
        path: '/posts',
        method: 'POST',
      });
      expect(params).toMatchObject({ resourceName: 'posts', actionName: 'create' });
    });

    it('get action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'GET',
      });
      expect(params).toMatchObject({ resourceName: 'posts', resourceIndex: '1', actionName: 'get' });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'PUT',
      });
      expect(params).toMatchObject({ resourceName: 'posts', resourceIndex: '1', actionName: 'update' });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'PATCH',
      });
      expect(params).toMatchObject({ resourceName: 'posts', resourceIndex: '1', actionName: 'update' });
    });

    it('delete action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'delete',
      });
      expect(params).toMatchObject({ resourceName: 'posts', resourceIndex: '1', actionName: 'destroy' });
    });

    it('delete action', () => {
      const params = parseRequest({
        path: '/posts/1,2,3,4,5,6',
        method: 'delete',
      });
      expect(params).toMatchObject({ resourceName: 'posts', resourceIndex: '1,2,3,4,5,6', actionName: 'destroy' });
    });

    it('index action', () => {
      const params = parseRequest({
        path: '/posts/1/comments',
        method: 'GET',
      });
      expect(params).toMatchObject({
        resourceName: 'comments',
        associatedName: 'posts',
        associatedIndex: '1',
        actionName: 'list',
      });
    });

    it('decode path', () => {
      const params = parseRequest({
        path: '/posts/%E7%9A%84%E6%B3%95%E5%9B%BD%E9%98%9F/comments',
        method: 'POST',
      });
      expect(params).toMatchObject({
        resourceName: 'comments',
        associatedName: 'posts',
        associatedIndex: '的法国队',
        actionName: 'create',
      });
    });

    it('store action', () => {
      const params = parseRequest({
        path: '/posts/1/comments',
        method: 'POST',
      });
      expect(params).toMatchObject({
        resourceName: 'comments',
        associatedName: 'posts',
        associatedIndex: '1',
        actionName: 'create',
      });
    });

    it('get action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'GET',
      });
      expect(params).toMatchObject({
        resourceName: 'comments',
        resourceIndex: '1',
        associatedName: 'posts',
        associatedIndex: '1',
        actionName: 'get',
      });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'PUT',
      });
      expect(params).toMatchObject({
        resourceName: 'comments',
        resourceIndex: '1',
        associatedName: 'posts',
        associatedIndex: '1',
        actionName: 'update',
      });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'PATCH',
      });
      expect(params).toMatchObject({
        resourceName: 'comments',
        resourceIndex: '1',
        associatedName: 'posts',
        associatedIndex: '1',
        actionName: 'update',
      });
    });

    it('get action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'delete',
      });
      expect(params).toMatchObject({
        resourceName: 'comments',
        resourceIndex: '1',
        associatedName: 'posts',
        associatedIndex: '1',
        actionName: 'destroy',
      });
    });

    it('export action', () => {
      const params = parseRequest({
        path: '/posts:export',
        method: 'GET',
      });
      expect(params).toMatchObject({ resourceName: 'posts', actionName: 'export' });
    });

    it('export action', () => {
      const params = parseRequest({
        path: '/posts:export',
        method: 'POST',
      });
      expect(params).toMatchObject({ resourceName: 'posts', actionName: 'export' });
    });

    it('export action', () => {
      const params = parseRequest({
        path: '/posts:export/1',
        method: 'POST',
      });
      expect(params).toMatchObject({ resourceName: 'posts', resourceIndex: '1', actionName: 'export' });
    });

    it('attach action', () => {
      const params = parseRequest({
        path: '/posts/1/tags:attach/2',
        method: 'POST',
      });
      expect(params).toMatchObject({
        resourceName: 'tags',
        resourceIndex: '2',
        associatedIndex: '1',
        associatedName: 'posts',
        actionName: 'attach',
      });
    });

    it('prefix options', () => {
      const params = parseRequest(
        {
          path: '/api/posts',
          method: 'GET',
        },
        {
          prefix: '/api',
        },
      );
      expect(params).toMatchObject({ resourceName: 'posts', actionName: 'list' });
    });

    it('prefix options', () => {
      const params = parseRequest(
        {
          path: '/posts',
          method: 'GET',
        },
        {
          prefix: '/api',
        },
      );
      expect(params).toBeFalsy();
    });

    it('actions options', () => {
      const params = parseRequest(
        {
          path: '/posts',
          method: 'GET',
        },
        {
          accessors: {
            list: 'query',
          },
        },
      );
      expect(params).toMatchObject({ resourceName: 'posts', actionName: 'query' });
    });

    it('actions options', () => {
      const params = parseRequest({
        path: '/posts:list',
        method: 'GET',
      });
      expect(params).toMatchObject({ resourceName: 'posts', actionName: 'list' });
    });

    it('actions options', () => {
      const params = parseRequest({
        path: '/resourcer/user.posts:list',
        method: 'GET',
      });
      expect(params).toMatchObject({ associatedName: 'user', resourceName: 'posts', actionName: 'list' });
    });
  });
});
