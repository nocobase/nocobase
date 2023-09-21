import { Database, mockDatabase } from '@nocobase/database';

describe('collection definition snapshot', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should get snapshot from collection', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'integer' },
      ],
    });

    const firstSnapShot = User.getDefinitionSnapshot();

    User.addField('email', { name: 'email', type: 'string' });

    const secondSnapShot = User.getDefinitionSnapshot();

    expect(firstSnapShot.hash).not.toBe(secondSnapShot.hash);
  });

  it('should detect snapshot changes', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'integer' },
      ],
    });

    expect(await db.collectionSnapshotManager.hasChanged(User)).toBeTruthy();

    await db.sync();

    expect(await db.collectionSnapshotManager.hasChanged(User)).toBeFalsy();

    User.addField('email', { name: 'email', type: 'string' });

    expect(await db.collectionSnapshotManager.hasChanged(User)).toBeTruthy();
  });
});
