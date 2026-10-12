import { defineMigration, type MigrationDefinition } from '@nocobase/db';
import original from '../../../database/migrations/202610090001_mail_create_message_participants.js';

const migration: MigrationDefinition = defineMigration({
  name: '202610090001_mail_test_participant_failure',
  async up(context) {
    let inserts = 0;
    const query = new Proxy(context.query, {
      get(target, key, receiver) {
        if (key === 'insertInto') {
          return (...args: Parameters<typeof target.insertInto>) => {
            inserts += 1;
            if (inserts === 2)
              throw new Error('Injected participant insert failure');
            return target.insertInto(...args);
          };
        }
        const value: unknown = Reflect.get(target, key, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    await original.up({ ...context, query });
  },
  async down(context) {
    await original.down?.(context);
  },
});

export default migration;
