import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// A new project's initialization (`server/projects-init`, `shared/project-init.ts`): one row per project whose working
// directory is initialized, with how and where that stands.
//
// - `method`: `template` (a new repository generated from a template repository, then `workflowId`/`workflowPath`/
//   `workflowName`, the workflow chosen to initialize it, or none) or `prompt` (the init issue's agent, given the
//   person's prompt, in a new empty repository, an existing one or a directory on a runner).
// - `connectionId`, `repo`, `repoUrl`, `defaultBranch`: the repository; null for a directory on a runner.
// - `firstCommit`: a prompt in a new, empty repository, whose first commit the agent makes on the default branch.
// - `state`: `pending`, `running`, `failed` or `done`. A workflow's latest run is kept (`runId`, `runStatus`,
//   `runConclusion`, `runUrl`, `runAttempt`); an agent's initialization is done once its run succeeded
//   (`runSucceeded`) and, with `firstCommit`, the first commit reached the default branch (`pushed`), in either order.
// - `issueId`: the "Initialize project" issue, the project's setup issue; `branchProtected` once done.
// - `checkedAt`: when Studio last read the workflow's newest run from the host itself, in case a delivery was lost.
const migration: MigrationDefinition = defineMigration({
  name: '202610040020_studio_create_project_inits',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'studioProjectInits',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The projects plugin's project and working directory (no foreign keys: the plugins' tables are their own).
          collection.string('projectId', { length: 64 }).notNull();
          collection.string('resourceId', { length: 64 }).nullable();
          collection.string('method', { length: 16 }).notNull();
          collection.string('connectionId', { length: 64 }).nullable();
          // `owner/name`.
          collection.string('repo', { length: 255 }).nullable();
          collection.string('repoUrl', { length: 500 }).nullable();
          collection.string('defaultBranch', { length: 255 }).nullable();
          collection.boolean('firstCommit').notNull().defaultTo(false);
          collection.string('templateRepo', { length: 255 }).nullable();
          // The `create-app` template a NocoBase application is scaffolded from (`shared/project-init.ts`); null otherwise.
          collection.string('appTemplate', { length: 32 }).nullable();
          collection.string('workflowId', { length: 64 }).nullable();
          collection.string('workflowPath', { length: 255 }).nullable();
          collection.string('workflowName', { length: 255 }).nullable();
          collection.string('agentId', { length: 64 }).nullable();
          collection.string('issueId', { length: 64 }).nullable();
          collection.string('state', { length: 16 }).notNull();
          collection.string('runId', { length: 64 }).nullable();
          collection.string('runName', { length: 255 }).nullable();
          collection.string('runStatus', { length: 32 }).nullable();
          collection.string('runConclusion', { length: 32 }).nullable();
          collection.string('runUrl', { length: 500 }).nullable();
          collection.integer('runAttempt').nullable();
          collection.boolean('runSucceeded').notNull().defaultTo(false);
          collection.boolean('pushed').notNull().defaultTo(false);
          collection.text('error').nullable();
          collection.boolean('branchProtected').nullable();
          collection.string('createdBy', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.datetimeTz('completedAt').nullable();
          collection.datetimeTz('checkedAt').nullable();
          collection.unique(['projectId'], { mode: 'index' });
          collection.index(['issueId']);
          collection.index(['repo']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioProjectInits');
  },
});

export default migration;
