import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Each computer's own key (`agentSessionComputers.keyHash`, its SHA-256), which its bridge authenticates with after its
 * owner first registered it, so the computer stays connected however long their sign-in lasts; and which run of the
 * bridge last registered it (`bridgeStartedAt`), so registering again from the same run leaves its sessions running.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610150001_agent_sessions_computer_keys',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessionComputers', (collection) => {
      collection.string('keyHash', { length: 64 }).nullable();
      collection.string('bridgeStartedAt', { length: 40 }).nullable();
      collection.unique(['keyHash'], {
        name: 'agent_session_computers_key_hash_unique',
      });
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.dropConstraint(
      'agentSessionComputers',
      'agent_session_computers_key_hash_unique',
    );
    await builder.alterCollection('agentSessionComputers', (collection) => {
      collection.dropFields('bridgeStartedAt', 'keyHash');
    });
  },
});

export default migration;
