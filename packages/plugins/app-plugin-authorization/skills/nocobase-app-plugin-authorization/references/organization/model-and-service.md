# Organisation model and service

Part of [the organisation dimension](overview.md), which states the model decisions this page implements.

## Migration

Write the tables in one self-contained migration under `database/main/migrations/`; read [migrations and seeds](../../../nocobase-app-development/references/migrations.md) and the `nocobase-db` Skill sections 2 and 3 for the file shape and the builder. Never import a runtime definition, constant or service into a migration. Add each business attribute the organisation owns, such as `region`, as a nullable column.

```ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610010001_create_departments',
  async up({ builder }) {
    await builder.createCollection('departments', (c) => {
      c.string('id', { length: 64 }).notNull();
      c.primary('id');
      c.string('title').notNull();
      c.string('parentId', { length: 64 }).nullable();
      c.string('region', { length: 64 }).nullable();
      c.boolean('active').notNull().defaultTo(true);
      c.integer('sortOrder').notNull().defaultTo(0);
      c.index('parentId');
    });
    await builder.createCollection('departmentMembers', (c) => {
      c.string('id', { length: 64 }).notNull();
      c.primary('id');
      c.string('departmentId', { length: 64 }).notNull();
      c.string('userId', { length: 64 }).notNull();
      c.boolean('primary').notNull().defaultTo(false);
      c.boolean('active').notNull().defaultTo(true);
      c.unique(['departmentId', 'userId']);
      c.index('userId');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('departmentMembers');
    await builder.dropCollection('departments');
  },
});

export default migration;
```

## The organisation service

Put the rules in one service registered by a provider, as [services and jobs](../../../nocobase-app-development/references/services-and-jobs.md) describes, so routes, the subject type and tests share them. Every read takes an optional connection, so it can run inside the caller's transaction.

```ts
export interface OrganizationService {
  /** Every department with `parentId`, `active` and `sortOrder`, for the settings tree. */
  listTree(): Promise<readonly Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(input: {
    id?: string;
    title: string;
    parentId?: string | null;
    region?: string | null;
  }): Promise<Department>;
  /** A new `parentId` or attribute changes what the subtree inherits, so it returns the affected members as `changed`. */
  updateDepartment(
    id: string,
    input: {
      title?: string;
      parentId?: string | null;
      region?: string | null;
      sortOrder?: number;
    },
  ): Promise<{ department: Department; changed: readonly string[] }>;
  /** The picker page: active departments only, literal title search in every shipped language, stable order. */
  listDepartments(query: {
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: readonly SubjectOption[]; total: number }>;
  /** The requested ids that exist; `description` names the parent, or is a descriptor marking a disabled one. */
  resolveDepartments(ids: readonly string[]): Promise<readonly SubjectOption[]>;
  /** The department and its ancestors, nearest first; `undefined` when any is inactive or missing. */
  activeChain(
    departmentId: string,
    connection?: DatabaseConnection,
  ): Promise<readonly string[] | undefined>;
  /** The ids whose whole chain is active, from one tree read. */
  filterActive(
    ids: readonly string[],
    connection?: DatabaseConnection,
  ): Promise<readonly string[]>;
  /** Active direct departments of an active membership, plus their ancestors. */
  departmentsOf(
    userId: string,
    connection?: DatabaseConnection,
  ): Promise<readonly string[]>;
  /** The details page: active direct memberships with `primary`. */
  directMembers(departmentId: string): Promise<readonly DirectMember[]>;
  /** Each write runs in one transaction and returns the user ids whose membership changed. */
  addMember(input: {
    departmentId: string;
    userId: string;
    primary?: boolean;
  }): Promise<readonly string[]>;
  removeMember(
    departmentId: string,
    userId: string,
  ): Promise<readonly string[]>;
  setPrimary(departmentId: string, userId: string): Promise<readonly string[]>;
  setActive(departmentId: string, active: boolean): Promise<readonly string[]>;
}
```

`SubjectOption.title` and `description` may be plain text or a `{ key, ns }` descriptor, and the authorization workspace renders either in the viewer's language, so return the stored title as it is and never compose display text such as "Disabled · Sales" on the server. Seeded titles are translation keys, so search in memory over the loaded tree, matching plain titles and the shipped translations of descriptor titles literally (`%` and `_` mean themselves), and sort by a stable text, then id, so pages never repeat or skip a row. `setActive` returns every member of the subtree, and `removeMember` the removed user.

Each write that changes membership, the primary department, a department's active state or one of its attributes also re-derives the business attributes of the users it returns, inside the same transaction, as [attribute sync](subjects.md#organisation-attributes-feed-business-data-scopes) shows.
