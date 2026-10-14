import {
  defineMigration,
  type CollectionDefinition,
  type MigrationDefinition,
} from '@nocobase/db';

function isDirectoryIndex(
  index: NonNullable<CollectionDefinition['indexes']>[number],
): boolean {
  return (
    index.fields?.length === 2 &&
    index.fields[0] === 'directoryKey' &&
    index.fields[1] === 'status'
  );
}

const migration: MigrationDefinition = defineMigration({
  name: '202610260001_ag_drop_directory_index',
  // Restoring this index would make the schema invalid on MySQL again.
  irreversible: true,
  async shouldRun({ builder }) {
    const collection = await builder.getCollection('agRuns');
    return collection?.indexes?.some(isDirectoryIndex) ?? false;
  },
  async up({ builder }) {
    const collection = await builder.getCollection('agRuns');
    const index = collection?.indexes?.find(isDirectoryIndex);
    if (index?.name) await builder.dropIndex('agRuns', index.name);
  },
});

export default migration;
