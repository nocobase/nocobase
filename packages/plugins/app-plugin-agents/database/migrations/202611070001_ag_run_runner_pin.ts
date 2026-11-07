import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611070001_ag_run_runner_pin',
  async up({ builder }) {
    await builder.alterCollection('agRuns', (collection) => {
      collection.string('runnerPinId');
    });
  },
  async down({ builder }) {
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('runnerPinId');
    });
  },
});
