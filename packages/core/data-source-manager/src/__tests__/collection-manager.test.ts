import { CollectionManager } from '@nocobase/data-source-manager';
import { Repository } from '../repository';

describe('Collection Manager', () => {
  it('should define collection', async () => {
    const collectionManager = new CollectionManager();

    collectionManager.defineCollection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    const UsersCollection = collectionManager.getCollection('users');
    expect(UsersCollection).toBeTruthy();

    expect(collectionManager.hasCollection('users')).toBeTruthy();
  });

  it('should register repository', async () => {
    class MockRepository extends Repository {
      async find() {
        return [];
      }
    }

    const collectionManager = new CollectionManager();
    collectionManager.registerRepositories({
      MockRepository: MockRepository,
    });

    collectionManager.defineCollection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
      repository: 'MockRepository',
    });

    const UsersCollection = collectionManager.getCollection('users');

    expect(UsersCollection.repository).toBe(MockRepository);
  });
});
