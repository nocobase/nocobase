import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Limits per coding tool beside a runner's total slots (`toolSlots`, such as `{ "claude": 2, "codex": 1 }`), on the
 * runner and on the registration token it takes them from, and the load the runner last reported per tool (`load`),
 * across every application it serves. Null for no limits per tool and for a runner that reported no load.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610080001_ag_add_runner_tool_slots',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.json('toolSlots').nullable();
      collection.json('load').nullable();
    });
    await builder.alterCollection('agRegistrationTokens', (collection) => {
      collection.json('toolSlots').nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRegistrationTokens', (collection) => {
      collection.dropField('toolSlots');
    });
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('load');
      collection.dropField('toolSlots');
    });
  },
});

export default migration;
