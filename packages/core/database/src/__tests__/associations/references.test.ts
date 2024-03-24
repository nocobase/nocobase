import { Database } from '../../database';
import { mockDatabase } from '../index';
describe('association references', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should add reference with default priority', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile' }],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'belongsTo', name: 'user' }],
    });

    await db.sync();

    const references = db.referenceMap.getReferences('users');

    expect(references[0].priority).toBe('default');
  });

  it('should add reference with user defined priority', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile', onDelete: 'CASCADE' }],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'belongsTo', name: 'user' }],
    });

    await db.sync();

    const references = db.referenceMap.getReferences('users');

    expect(references.length).toBe(1);
    expect(references[0].priority).toBe('user');
  });
});
