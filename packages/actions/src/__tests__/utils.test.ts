import { filterByFields } from '../utils';

describe('utils', () => {
  describe('filterByFields', () => {
    it('only fields', () => {
      const values = filterByFields({
        title: 'title1',
        sort: 100,
        user: { name: 'aaa' }
      }, ['title'])
      expect(values).toEqual({
        title: 'title1'
      });
    });

    it('except fields', () => {
      const values = filterByFields({
        title: 'title1',
        sort: 100,
        user: { name: 'aaa', profile: { email: 'email' } }
      }, {
        except: ['sort', 'user.profile']
      })
      expect(values).toEqual({
        title: 'title1',
        user: { name: 'aaa' }
      });
    });

    it('only and except fields', () => {
      const values = filterByFields({
        title: 'title1',
        sort: 100,
        user: { name: 'aaa', profile: { email: 'email' } }
      }, {
        only: ['user'],
        except: ['sort', 'user.profile']
      })
      expect(values).toEqual({
        user: { name: 'aaa' }
      });
    });

    it('only and except fields with array', () => {
      const values = filterByFields({
        title: 'title1',
        comments: [
          { content: 'comment1', status: 'published', sort: 1 },
          { content: 'comment2', status: 'draft', sort: 2 }
        ]
      }, {
        only: ['comments'],
        except: ['comments.status', 'comments.sort']
      });
      expect(values).toEqual({
        comments: [
          { content: 'comment1' },
          { content: 'comment2' }
        ]
      });
    });

    it('only and except fields with array', () => {
      const values = filterByFields({
        title: 'title1',
        user: { name: 'aaa', profile: { email: 'email' } },
        comments: [
          { content: 'comment1', status: 'published', sort: 1 },
          { content: 'comment2', status: 'draft', sort: 2 }
        ]
      }, {
        only: ['comments.content'],
        except: ['user.name']
      });
      expect(values).toEqual({
        user: {
          profile: { email: 'email' }
        },
        comments: [
          { content: 'comment1' },
          { content: 'comment2' }
        ]
      });
    });

    it('empty values', () => {
      const values = filterByFields({}, {
        only: ['a']
      });
      expect(values).toEqual({});
    });

    it('null values', () => {
      const values = filterByFields(null, {
        only: ['a']
      });
      expect(values).toBe(null);
    });

    it('undefined values', () => {
      const values = filterByFields(undefined, {
        only: ['a']
      });
      expect(values).toBeUndefined();
    });
  });
});
