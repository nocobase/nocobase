import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610180001_agent_sessions_bridge_protocol',
  async up({ builder }): Promise<void> {
    await builder.alterCollection('agentSessionComputers', (collection) => {
      collection.integer('protocol').nullable();
    });
  },
  async down({ builder }): Promise<void> {
    await builder.alterCollection('agentSessionComputers', (collection) => {
      collection.dropFields('protocol');
    });
  },
});
export default migration;
