import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The installation tokens a GitHub App connection minted, kept until shortly before they expire so every process and
// restart reuses them (`server/git/installation-tokens.ts`, `@octokit/auth-app`'s cache).
//
// - `id`: a digest of the connection and the cache key (the installation, and the repositories and permissions a push
//   credential is limited to).
// - `connectionId`: the connection (`studioGitConnections.id`) whose tokens are forgotten when it changes or goes.
// - `valueSealed`: what the cache keeps, the token included, sealed for the connection and the row.
// - `expiresAt`: when Studio stops reusing it.
const migration: MigrationDefinition = defineMigration({
  name: '202610200010_studio_create_git_installation_tokens',

  async up({ builder }) {
    await builder.createCollection(
      'studioGitInstallationTokens',
      (collection) => {
        collection.string('id', { length: 64 }).primary().notNull();
        collection.string('connectionId', { length: 64 }).notNull();
        collection.text('valueSealed').notNull();
        collection.datetimeTz('expiresAt').notNull();
        collection.index(['connectionId']);
      },
    );
  },

  async down({ builder }) {
    await builder.dropCollection('studioGitInstallationTokens');
  },
});

export default migration;
