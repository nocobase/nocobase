import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { buildFilter } from '@nocobase/repository-input';

export const CUSTOMERS = 'exampleCustomers';
export const CONTACTS = 'exampleContacts';
export const REPS = 'exampleSalesReps';
export interface Customer {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'closed';
  ownerId: string;
  notes: string;
}
export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  title: string;
}
export interface SalesRep {
  id: string;
  userId: string;
  name: string;
  active: boolean;
}

const customerData = defineDatabasePermission((p) =>
  p
    .collection<Customer>(CUSTOMERS)
    .read(['id', 'name', 'status', 'ownerId', 'notes']),
);
const contactData = defineDatabasePermission((p) =>
  p
    .collection<Contact>(CONTACTS)
    .read(['id', 'customerId', 'name', 'email', 'phone', 'title']),
);
const repData = defineDatabasePermission((p) =>
  p.collection<SalesRep>(REPS).read(['id', 'name', 'active']),
);
export const customerResource = defineCompositeResource(
  'example.crm.customers',
  (r) =>
    r
      .title('Example customers')
      .action('view', (a) =>
        a.title('View customers').grant('customers', customerData),
      )
      .action('edit', (a) =>
        a
          .title('Edit customer details and status')
          .grant('customers', customerData.update(['name', 'notes', 'status'])),
      )
      .action('assign', (a) =>
        a
          .title('Assign customer owners')
          .grant('customers', customerData.update(['ownerId'])),
      ),
);
export const contactResource = defineCompositeResource(
  'example.crm.contacts',
  (r) =>
    r
      .title('Example contacts')
      .action('view', (a) =>
        a.title('View contacts').grant('contacts', contactData),
      )
      .action('edit', (a) =>
        a
          .title('Maintain contacts')
          .grant(
            'contacts',
            contactData
              .create(['id', 'customerId', 'name', 'email', 'phone', 'title'])
              .update(['customerId', 'name', 'email', 'phone', 'title'])
              .delete(),
          )
          .grant('customers', customerData),
      ),
);
export const repResource = defineCompositeResource(
  'example.crm.salesReps',
  (r) =>
    r
      .title('Example customer owners')
      .action('view', (a) =>
        a.title('Select customer owners').grant('salesReps', repData),
      ),
);

export default class CustomerContactsAuthorizationProvider extends ServiceProvider<Application> {
  readonly name = 'app/customer-contacts-authorization';
  override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    for (const [name, title] of [
      [CUSTOMERS, 'Example customers'],
      [CONTACTS, 'Example contacts'],
      [REPS, 'Example customer owners'],
    ])
      authz.database.collections.add({ name, title });
    authz.recordAccess.define(
      defineRecordAccess('example.crm.own', (a) =>
        a
          .title('Customers I own')
          .collections(CUSTOMERS, CONTACTS, REPS)
          .resolver(async ({ collection, principal }) => {
            const database = this.app.container.resolve(databaseManagerToken);
            if (collection === REPS)
              return buildFilter((f) => f.string('userId').eq(principal.id));
            // Record Access accepts scalar predicates only. Resolve ownership ids first,
            // then leave all record reads and writes constrained by the resulting Policy.
            const reps = await database.repository<SalesRep>(REPS).findMany({
              filter: { userId: principal.id },
              select: (s) => s.fields('id'),
            });
            const repIds = reps.map((row) => row.id);
            if (!repIds.length) return false;
            const ownerFilter = buildFilter((f) =>
              f.or(repIds.map((id) => f.string('ownerId').eq(id))),
            );
            if (collection === CUSTOMERS) return ownerFilter;
            const customers = await database
              .repository<Customer>(CUSTOMERS)
              .findMany({ filter: ownerFilter, select: (s) => s.fields('id') });
            return customers.length
              ? buildFilter((f) =>
                  f.or(
                    customers.map((row) => f.string('customerId').eq(row.id)),
                  ),
                )
              : false;
          }),
      ),
    );
    authz.ui.sections.add({
      name: 'example.crm',
      title: 'Customers and contacts',
      parent: 'business',
    });
    for (const resource of [customerResource, contactResource, repResource])
      authz.ui.place(authz.compositeResources.define(resource.build()), {
        section: 'example.crm',
      });
  }
}
