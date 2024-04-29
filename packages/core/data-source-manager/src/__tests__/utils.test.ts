import { joinCollectionName, parseCollectionName } from '@nocobase/data-source-manager';

describe('utils', () => {
  it('should join collection name', async () => {
    expect(joinCollectionName('main', 'users')).toBe('users');
    expect(joinCollectionName('test', 'users')).toBe('test:users');
  });

  it('should parse collection name', async () => {
    expect(parseCollectionName('main:users')).toEqual(['main', 'users']);
    expect(parseCollectionName('users')).toEqual(['main', 'users']);
    expect(parseCollectionName('')).toEqual([]);
  });
});
