import { initDatabase, agent } from './index';
import { filterByFields } from '../utils';

describe('utils', () => {
  describe('filterByFields', () => {
    it('only fields', async () => {
      const values = filterByFields({
        title: 'title1',
        sort: 100,
        user: { name: 'aaa' }
      }, ['title'])
      expect(values).toEqual({
        title: 'title1'
      });
    });

    it('except fields', async () => {
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

    it('only and except fields', async () => {
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
  });
});
