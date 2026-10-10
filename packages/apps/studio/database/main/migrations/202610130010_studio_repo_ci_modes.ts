import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// How a repository's CI is connected (`server/builds/ci-modes.ts`, `shared/ci-modes.ts`), chosen in its "Deploy (CI)"
// settings or when it is added: `setups` keeps one choice per kind of CI (`preview`, later `staging` and
// `production`), `{ [kind]: { mode, apps, workflowFiles, taskIssueId } }`:
//
// - `mode`: `direct` (Studio writes the standard workflows), `template` (Studio writes the person's edited workflow
//   files), `agent` (an issue asks an agent to adapt the repository's CI), `manual` or `ownAgent` (set up outside
//   Studio);
// - `apps`: the NocoBase applications the repository holds, `[{ directory, appId }]`, which the workflows build;
// - `workflowFiles`: the edited files of `template`, `[{ path, content }]`;
// - `taskIssueId`: the issue of `agent`.
//
// Null before anyone chose.
const migration: MigrationDefinition = defineMigration({
  name: '202610130010_studio_repo_ci_modes',

  async up({ builder }) {
    await builder.alterCollection('studioRepoCi', (collection) => {
      collection.json('setups').nullable();
    });
  },

  async down({ builder }) {
    await builder.alterCollection('studioRepoCi', (collection) => {
      collection.dropField('setups');
    });
  },
});

export default migration;
