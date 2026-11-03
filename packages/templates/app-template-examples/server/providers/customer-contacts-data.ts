import type {
  Customer,
  Contact,
  SalesRep,
} from './customer-contacts-authorization.js';

/** Fictional learning records only; reset preserves user accounts and permission assignments. */
export function customerContactsData(users: {
  manager: string;
  rep: string;
  colleague: string;
}) {
  const reps: SalesRep[] = [
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
  const customers: Customer[] = Array.from({ length: 30 }, (_, i) => ({
    id: `customer-${String(i + 1).padStart(2, '0')}`,
    name: `${['Acorn', 'Birch', 'Cedar', 'Maple', 'Willow'][i % 5]} ${String(i + 1).padStart(2, '0')}`,
    status: i % 10 === 9 ? 'closed' : i % 3 === 0 ? 'paused' : 'active',
    ownerId: i < 20 ? 'crm-rep' : 'crm-colleague',
    notes: 'Fictional customer for relation and batch-edit practice.',
  }));
  const contacts: Contact[] = customers.map((customer, i) => ({
    id: `contact-${String(i + 1).padStart(2, '0')}`,
    customerId: customer.id,
    name: `Contact ${i + 1}`,
    email: `contact${i + 1}@example.test`,
    phone: '',
    title: 'Buyer',
  }));
  return { reps, customers, contacts };
}
