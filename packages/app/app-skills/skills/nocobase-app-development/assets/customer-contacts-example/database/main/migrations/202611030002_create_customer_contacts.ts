import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611030002_create_customer_contacts',
  async up({ builder }) {
    await builder.createCollection('exampleSalesReps', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('userId', { length: 64 }).notNull();
      c.string('name', { length: 100 }).notNull();
      c.boolean('active').notNull().defaultTo(true);
      c.unique('userId');
    });
    await builder.createCollection('exampleCustomers', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('name', { length: 100 }).notNull();
      c.string('status', { length: 16 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.text('notes').notNull();
      c.index('ownerId');
      c.index('status');
      c.belongsTo('owner', 'exampleSalesReps')
        .foreignKey('ownerId')
        .targetKey('id');
    });
    await builder.createCollection('exampleContacts', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('customerId', { length: 64 }).notNull();
      c.string('name', { length: 100 }).notNull();
      c.string('email', { length: 254 }).notNull();
      c.string('phone', { length: 100 }).notNull();
      c.string('title', { length: 100 }).notNull();
      c.index('customerId');
      c.belongsTo('customer', 'exampleCustomers')
        .foreignKey('customerId')
        .targetKey('id');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('exampleContacts');
    await builder.dropCollection('exampleCustomers');
    await builder.dropCollection('exampleSalesReps');
  },
});
