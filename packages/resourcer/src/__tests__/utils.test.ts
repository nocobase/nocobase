import { parseRequest } from '..';

describe('utils', () => {
  describe('parseRequest', () => {
    it('index action', () => {
      const params = parseRequest({
        path: '/posts',
        method: 'GET',
      });
      expect(params).toEqual({ resourceName: 'posts', actionName: 'list' });
    });

    it('store action', () => {
      const params = parseRequest({
        path: '/posts',
        method: 'POST',
      });
      expect(params).toEqual({ resourceName: 'posts', actionName: 'create' });
    });

    it('get action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'GET',
      });
      expect(params).toEqual({ resourceName: 'posts', resourceKey: '1', actionName: 'get' });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'PUT',
      });
      expect(params).toEqual({ resourceName: 'posts', resourceKey: '1', actionName: 'update' });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'PATCH',
      });
      expect(params).toEqual({ resourceName: 'posts', resourceKey: '1', actionName: 'update' });
    });

    it('delete action', () => {
      const params = parseRequest({
        path: '/posts/1',
        method: 'delete',
      });
      expect(params).toEqual({ resourceName: 'posts', resourceKey: '1', actionName: 'destroy' });
    });

    it('delete action', () => {
      const params = parseRequest({
        path: '/posts/1,2,3,4,5,6',
        method: 'delete',
      });
      expect(params).toEqual({ resourceName: 'posts', resourceKey: '1,2,3,4,5,6', actionName: 'destroy' });
    });

    it('index action', () => {
      const params = parseRequest({
        path: '/posts/1/comments',
        method: 'GET',
      });
      expect(params).toEqual({ resourceName: 'comments', associatedName: 'posts', associatedKey: '1', actionName: 'list' });
    });

    it('store action', () => {
      const params = parseRequest({
        path: '/posts/1/comments',
        method: 'POST',
      });
      expect(params).toEqual({ resourceName: 'comments', associatedName: 'posts', associatedKey: '1', actionName: 'create' });
    });

    it('get action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'GET',
      });
      expect(params).toEqual({ resourceName: 'comments', resourceKey: '1', associatedName: 'posts', associatedKey: '1', actionName: 'get' });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'PUT',
      });
      expect(params).toEqual({ resourceName: 'comments', resourceKey: '1', associatedName: 'posts', associatedKey: '1', actionName: 'update' });
    });

    it('update action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'PATCH',
      });
      expect(params).toEqual({ resourceName: 'comments', resourceKey: '1', associatedName: 'posts', associatedKey: '1', actionName: 'update' });
    });

    it('get action', () => {
      const params = parseRequest({
        path: '/posts/1/comments/1',
        method: 'delete',
      });
      expect(params).toEqual({ resourceName: 'comments', resourceKey: '1', associatedName: 'posts', associatedKey: '1', actionName: 'destroy' });
    });

    it('export action', () => {
      const params = parseRequest({
        path: '/posts:export',
        method: 'GET',
      });
      expect(params).toEqual({ resourceName: 'posts', actionName: 'export' });
    });

    it('export action', () => {
      const params = parseRequest({
        path: '/posts:export',
        method: 'POST',
      });
      expect(params).toEqual({ resourceName: 'posts', actionName: 'export' });
    });

    it('export action', () => {
      const params = parseRequest({
        path: '/posts:export/1',
        method: 'POST',
      });
      expect(params).toEqual({ resourceName: 'posts', resourceKey: '1', actionName: 'export' });
    });

    it('attach action', () => {
      const params = parseRequest({
        path: '/posts/1/tags:attach/2',
        method: 'POST',
      });
      expect(params).toEqual({
        resourceName: 'tags',
        resourceKey: '2',
        associatedKey: '1',
        associatedName: 'posts',
        actionName: 'attach',
      });
    });

    it('prefix options', () => {
      const params = parseRequest({
        path: '/api/posts',
        method: 'GET',
      }, {
        prefix: '/api'
      });
      expect(params).toEqual({ resourceName: 'posts', actionName: 'list' });
    });

    it('prefix options', () => {
      const params = parseRequest({
        path: '/posts',
        method: 'GET',
      }, {
        prefix: '/api'
      });
      expect(params).toBeFalsy();
    });

    it('actions options', () => {
      const params = parseRequest({
        path: '/posts',
        method: 'GET',
      }, {
        accessors: {
          list: 'query'
        }
      });
      expect(params).toEqual({ resourceName: 'posts', actionName: 'query' });
    });

    it('actions options', () => {
      const params = parseRequest({
        path: '/posts:list',
        method: 'GET',
      });
      expect(params).toEqual({ resourceName: 'posts', actionName: 'list' });
    });

    it('actions options', () => {
      const params = parseRequest({
        path: '/user.posts:list',
        method: 'GET',
      });
      expect(params).toEqual({ associatedName: 'user', resourceName: 'posts', actionName: 'list' });
    });
  });
});