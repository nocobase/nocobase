import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611030002_create_customer_contacts', {
  sources: [
    {
      packageName: 'customer-contacts-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('exampleSalesReps').toHaveField('userId', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('exampleCustomers').toHaveField('ownerId', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('exampleContacts').toHaveField('customerId', {
      type: 'string',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'exampleSalesReps',
      'exampleCustomers',
      'exampleContacts',
    ])
      await expectCollection(name).not.toExist();
  },
});
