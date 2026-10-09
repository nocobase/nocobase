import { resolve } from 'node:path';
import {
  InMemoryCollectionMetadataStore,
  type DatabaseManager,
  type CollectionMetadataStore,
} from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';

const databases = new WeakMap<DatabaseManager, TestDatabase>();

export async function createMailTestDatabase(
  options: {
    migrate?: boolean;
    metadataStore?: CollectionMetadataStore;
  } = {},
): Promise<DatabaseManager> {
  const fixture = await createTestDatabase({
    metadataStore:
      options.metadataStore ?? new InMemoryCollectionMetadataStore(),
    migrations:
      options.migrate === false
        ? []
        : [
            {
              directory: resolve(
                import.meta.dirname,
                '../../database/migrations',
              ),
              packageName: '@nocobase/app-plugin-mail',
            },
          ],
  });
  databases.set(fixture.database, fixture);
  return fixture.database;
}

export async function destroyMailTestDatabase(
  database: DatabaseManager,
): Promise<void> {
  const fixture = databases.get(database);
  if (!fixture) return;
  databases.delete(database);
  await fixture.destroy();
}
