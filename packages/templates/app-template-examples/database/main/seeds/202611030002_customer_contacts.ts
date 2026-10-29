import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  customerResource,
  contactResource,
  repResource,
} from '../../../server/providers/customer-contacts-authorization.js';
import { customerContactsData } from '../../../server/providers/customer-contacts-data.js';

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
      const actions = {
        view: { customers: scope },
        edit: { customers: scope },
        ...(role === 'manager' ? { assign: { customers: scope } } : {}),
      };
      const definition = definePermissionSet(`crm-${role}`)
        .title(`CRM ${role}`)
        .grant({
          resource: { type: 'page', id: 'customer-contacts' },
          actions: [{ action: 'access' }],
        })
        .grant(
          customerResource.reference().grant(actions),
          contactResource
            .reference()
            .grant({
              view: { contacts: scope },
              edit: { contacts: scope, customers: scope },
            }),
          repResource.reference().grant({ view: { salesReps: scope } }),
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
    const data = customerContactsData(users);
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
