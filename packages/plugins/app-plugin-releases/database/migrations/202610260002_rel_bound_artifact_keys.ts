import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610260002_rel_bound_artifact_keys',
  // The old full-column unique index cannot be restored on MySQL.
  irreversible: true,
  async shouldRun({ builder }) {
    const collection = await builder.getCollection('relReleases');
    return (
      collection?.fields?.find((field) => field.name === 'artifactKey')
        ?.length !== 172
    );
  },
  async up({ builder, query, connection }) {
    // A portable character-count check, before any DDL can truncate old data.
    const oversized = await query
      .selectFrom('relReleases')
      .select('id')
      .where('artifactKey', 'like', `${'_'.repeat(173)}%`)
      .limit(1)
      .executeTakeFirst();
    if (oversized)
      throw new Error(
        `Release "${String(oversized.id)}" has an artifact key longer than 172 characters. Resolve legacy artifact keys before retrying this migration; no keys have been changed.`,
      );
    const collection = await builder.getCollection('relReleases');
    if (
      collection?.fields?.find((field) => field.name === 'artifactKey')
        ?.length === 172
    )
      return;
    // SQL Server cannot shrink a column while its unique index depends on it.
    // Rebuild that index in the migration transaction, after validating every key.
    // The physical name depends on the connection's naming configuration.
    const indexName =
      connection.dialect === 'mssql'
        ? collection?.indexes?.find(
            (index) =>
              index.db?.unique === true &&
              index.fields?.length === 1 &&
              index.fields[0] === 'artifactKey',
          )?.name
        : undefined;
    if (indexName) await builder.dropConstraint('relReleases', indexName);
    await builder.alterField('relReleases', 'artifactKey', {
      type: 'string',
      length: 172,
      nullable: true,
    });
    if (indexName)
      await builder.addConstraint('relReleases', {
        type: 'unique',
        fields: ['artifactKey'],
        name: indexName,
        mode: 'index',
      });
  },
});

export default migration;
