import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';

// Keep installation data self-contained: Node loads seed source directly, while
// the application server is compiled separately. Grants reference registered resource ids.

export default defineSeed({
  name: '202611030002_customer_contacts',
  transaction: true,
  async run(task) {
    const { query } = task;
    const users = {
      manager: randomUUID(),
      rep: randomUUID(),
      colleague: randomUUID(),
    };
    const now = new Date();
    const password = await hashPassword('CustomerExample123!');
    for (const [role, id] of Object.entries(users)) {
      await query
        .insertInto('user')
        .values({
          id,
          username: `crm_${role}`,
          email: `crm_${role}@example.test`,
          name: `CRM ${role}`,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      await query
        .insertInto('account')
        .values({
          id: randomUUID(),
          accountId: id,
          providerId: 'credential',
          userId: id,
          password,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
    for (const role of ['manager', 'rep'] as const) {
      const scope = role === 'manager' ? 'allRecords' : 'example.crm.own';
      const definition = definePermissionSet(`crm-${role}`)
        .title(`CRM ${role}`)
        .grant({
          resource: { type: 'page', id: 'customer-contacts' },
          actions: [{ action: 'access' }],
        })
        .grant(
          {
            resource: { type: 'composite', id: 'example.crm.customers' },
            actions: ['view', 'edit', ...(role === 'manager' ? ['assign'] : [])].map(
              (action) => ({
                action,
                policy: { type: 'composite', scopes: { customers: scope } },
              }),
            ),
          },
          {
            resource: { type: 'composite', id: 'example.crm.contacts' },
            actions: [
              {
                action: 'view',
                policy: { type: 'composite', scopes: { contacts: scope } },
              },
              {
                action: 'edit',
                policy: {
                  type: 'composite',
                  scopes: { contacts: scope, customers: scope },
                },
              },
            ],
          },
          {
            resource: { type: 'composite', id: 'example.crm.salesReps' },
            actions: [
              {
                action: 'view',
                policy: { type: 'composite', scopes: { salesReps: scope } },
              },
            ],
          },
        )
        .build();
      // Initial configuration only; an existing administrator definition remains editable and is preserved.
      if (
        !(await task
          .repository('authorizationPermissionSets')
          .exists({ filter: { key: definition.key } }))
      ) {
        await query
          .insertInto('authorizationPermissionSets')
          .values({
            id: definition.key,
            key: definition.key,
            title: encodeAuthorizationTitle(definition.title),
            grants: JSON.stringify(definition.grants),
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      }
      const assigned =
        role === 'manager' ? [users.manager] : [users.rep, users.colleague];
      for (const subjectId of assigned)
        await query
          .insertInto('authorizationPermissionSetAssignments')
          .values({
            id: randomUUID(),
            permissionSetKey: definition.key,
            subjectType: 'user',
            subjectId,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
    }
    const data = initialCustomerContactsData(users);
    for (const values of data.reps)
      await task
        .repository('exampleSalesReps')
        .createOne({ values: { ...values } });
    for (const values of data.customers)
      await task
        .repository('exampleCustomers')
        .createOne({ values: { ...values } });
    for (const values of data.contacts)
      await task
        .repository('exampleContacts')
        .createOne({ values: { ...values } });
  },
});

// This installation snapshot stays stable if the reset service's sample data evolves.
function initialCustomerContactsData(users: {
  manager: string;
  rep: string;
  colleague: string;
}) {
  const reps = [
    { id: 'crm-rep', userId: users.rep, name: 'Alex Rivera', active: true },
    {
      id: 'crm-colleague',
      userId: users.colleague,
      name: 'Jordan Lee',
      active: true,
    },
    {
      id: 'crm-inactive',
      userId: users.manager,
      name: 'Taylor (inactive)',
      active: false,
    },
  ];
  const customers = Array.from({ length: 30 }, (_, i) => ({
    id: `customer-${String(i + 1).padStart(2, '0')}`,
    name: `${['Acorn', 'Birch', 'Cedar', 'Maple', 'Willow'][i % 5]} ${String(i + 1).padStart(2, '0')}`,
    status: i % 10 === 9 ? 'closed' : i % 3 === 0 ? 'paused' : 'active',
    ownerId: i < 20 ? 'crm-rep' : 'crm-colleague',
    notes: 'Fictional customer for relation and batch-edit practice.',
  }));
  const contacts = customers.map((customer, i) => ({
    id: `contact-${String(i + 1).padStart(2, '0')}`,
    customerId: customer.id,
    name: `Contact ${i + 1}`,
    email: `contact${i + 1}@example.test`,
    phone: '',
    title: 'Buyer',
  }));
  return { reps, customers, contacts };
}
