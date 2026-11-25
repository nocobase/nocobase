import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Which agent wrote a skill version for its author, and in which run (`SkillVersion.viaAgentId`, `viaRunId`): set when
 * an agent's run saved, restored or imported it for the person who woke it; null for a person's own change and for
 * every earlier version.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611250001_ag_skill_version_via',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agSkillVersions', (collection) => {
      collection.string('viaAgentId', { length: 64 }).nullable();
      collection.string('viaRunId', { length: 64 }).nullable();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agSkillVersions', (collection) => {
      collection.dropField('viaRunId');
      collection.dropField('viaAgentId');
    });
  },
});

export default migration;
