import {
  selection,
  type AuthorizationTitle,
} from '@nocobase/authorization/core';
import {
  definePermissionSet,
  type PermissionSet,
} from '@nocobase/authorization/permission-sets';
import type { SharingRule } from '@nocobase/authorization/sharing-rules';

import {
  DEPARTMENT_HEAD_SUBJECT,
  DEPARTMENT_SUBJECT,
  label,
  SCOPE_MY_DEPARTMENTS,
  SCOPE_MY_DEPARTMENTS_AND_BELOW,
} from '../../server/resources.js';
import { SHARED_WITH_DELIVERY } from './sales.js';

export interface SeedDepartment {
  readonly id: string;
  /** A translation descriptor; the seed stores it encoded, and the client translates it. */
  readonly title: AuthorizationTitle;
  readonly parentId: string | null;
  readonly region: string | null;
  readonly sortOrder: number;
}

/** Parents before children, so every parent exists when its child is written. */
export const SEED_DEPARTMENTS: readonly SeedDepartment[] = [
  {
    id: 'trading',
    title: label('seed.trading'),
    parentId: null,
    region: null,
    sortOrder: 0,
  },
  {
    id: 'executive-office',
    title: label('seed.executiveOffice'),
    parentId: 'trading',
    region: null,
    sortOrder: 0,
  },
  {
    id: 'sales-center',
    title: label('seed.salesCenter'),
    parentId: 'trading',
    region: null,
    sortOrder: 1,
  },
  {
    id: 'north-sales',
    title: label('seed.northSales'),
    parentId: 'sales-center',
    region: 'North',
    sortOrder: 0,
  },
  {
    id: 'south-sales',
    title: label('seed.southSales'),
    parentId: 'sales-center',
    region: 'South',
    sortOrder: 1,
  },
  {
    id: 'delivery-center',
    title: label('seed.deliveryCenter'),
    parentId: 'trading',
    region: null,
    sortOrder: 2,
  },
  {
    id: 'delivery',
    title: label('seed.delivery'),
    parentId: 'delivery-center',
    region: null,
    sortOrder: 0,
  },
];

/** The sales example's pages and composites, by the ids it registers them under. */
const PAGES = [
  'example.sales.projects',
  'example.sales.quotes',
  'example.sales.orders',
] as const;
const PROJECTS_COMPOSITE = 'example.sales.projects';

function pageAccess(...pages: readonly string[]) {
  return pages.map((id) => ({
    resource: { type: 'page', id },
    actions: [{ action: 'access' }],
  }));
}

/** A composite's `view`, with one data scope set to a record access. */
function viewWith(composite: string, scopeKey: string, recordAccess: string) {
  return {
    resource: { type: 'composite', id: composite },
    actions: [
      {
        action: 'view',
        policy: {
          type: 'composite' as const,
          scopes: { [scopeKey]: recordAccess },
        },
      },
    ],
  };
}

/**
 * This organisation's own permission sets. Relative scopes let one set serve every holder: the head set reaches
 * each head's own departments and those below them, whoever the head is; the own-projects viewer reaches the
 * projects each holder owns, through the built-in `recordsIOwn` on `ownerId`.
 */
export const DEPARTMENT_SETS = {
  head: 'departments-example-head',
  projectViewer: 'departments-example-project-viewer',
  projectViewerOwn: 'departments-example-project-viewer-own',
} as const;

export const SEED_PERMISSION_SETS: readonly PermissionSet[] = [
  definePermissionSet(DEPARTMENT_SETS.head)
    .title(label('sets.head'))
    .grant(
      ...pageAccess(...PAGES),
      viewWith(PROJECTS_COMPOSITE, 'projects', SCOPE_MY_DEPARTMENTS_AND_BELOW),
      viewWith(
        'example.sales.quotes',
        'quotes',
        SCOPE_MY_DEPARTMENTS_AND_BELOW,
      ),
      viewWith(
        'example.sales.orders',
        'orders',
        SCOPE_MY_DEPARTMENTS_AND_BELOW,
      ),
    )
    .build(),
  definePermissionSet(DEPARTMENT_SETS.projectViewer)
    .title(label('sets.projectViewer'))
    .grant(
      ...pageAccess(PROJECTS_COMPOSITE),
      viewWith(PROJECTS_COMPOSITE, 'projects', SCOPE_MY_DEPARTMENTS),
    )
    .build(),
  definePermissionSet(DEPARTMENT_SETS.projectViewerOwn)
    .title(label('sets.projectViewerOwn'))
    .grant(
      ...pageAccess(PROJECTS_COMPOSITE),
      viewWith(PROJECTS_COMPOSITE, 'projects', 'recordsIOwn'),
    )
    .build(),
];

/** The authorization example's permission sets this organisation reuses. */
export const SALES_SETS = {
  assistant: 'example-sales-assistant',
  engineer: 'example-sales-engineer',
  manager: 'example-sales-manager',
  delivery: 'example-sales-delivery',
} as const;

export interface SeedAssignment {
  readonly id: string;
  readonly permissionSetKey: string;
  readonly subjectType: string;
  readonly subjectId: string;
}

/**
 * Baseline access by department. Sales Center's assistant set reaches both regional sales departments below it;
 * Delivery holds the delivery set. Job roles above the baseline are assigned to people, in {@link DEMO_ACCOUNTS}.
 */
export const DEPARTMENT_ASSIGNMENTS: readonly SeedAssignment[] = [
  {
    id: 'departments-example:sales-center:assistant',
    permissionSetKey: SALES_SETS.assistant,
    subjectType: DEPARTMENT_SUBJECT,
    subjectId: 'sales-center',
  },
  {
    id: 'departments-example:delivery:delivery',
    permissionSetKey: SALES_SETS.delivery,
    subjectType: DEPARTMENT_SUBJECT,
    subjectId: 'delivery',
  },
  // North Sales colleagues read each other's projects.
  {
    id: 'departments-example:north-sales:project-viewer',
    permissionSetKey: DEPARTMENT_SETS.projectViewer,
    subjectType: DEPARTMENT_SUBJECT,
    subjectId: 'north-sales',
  },
  // Delivery needs the projects view action for the sales-projects sharing rule to widen; it owns no project.
  {
    id: 'departments-example:delivery:project-viewer-own',
    permissionSetKey: DEPARTMENT_SETS.projectViewerOwn,
    subjectType: DEPARTMENT_SUBJECT,
    subjectId: 'delivery',
  },
  // Assigned once: every head of an active department holds it, and it follows each appointment.
  {
    id: 'departments-example:heads:head',
    permissionSetKey: DEPARTMENT_SETS.head,
    subjectType: DEPARTMENT_HEAD_SUBJECT,
    subjectId: '*',
  },
];

/**
 * This organisation's own sharing rule: Delivery reads the sales projects it prepares for. It selects records by id;
 * a viewer-relative scope such as 本部门及下属部门 is computed for the viewer, so it cannot name another department.
 */
export const SEED_SHARING_RULES: readonly SharingRule[] = [
  {
    key: 'departments-example-sales-projects',
    title: label('rules.salesProjects'),
    resource: { type: 'composite', id: PROJECTS_COMPOSITE },
    actions: [
      {
        action: 'view',
        scopeKey: 'projects',
        selection: selection.records([...SHARED_WITH_DELIVERY]),
      },
    ],
    subjects: [{ type: DEPARTMENT_SUBJECT, id: 'delivery' }],
  },
];

export interface SeedRuleAssignment {
  readonly id: string;
  readonly ruleId: string;
  readonly subjectId: string;
}

/**
 * The authorization example's sharing rules, assigned to departments. Sharing never grants an action: it widens
 * the records of actions a member already holds.
 */
export const SHARING_ASSIGNMENTS: readonly SeedRuleAssignment[] = [
  // Salespeople read their region's orders; delivery staff also deliver them.
  {
    id: 'departments-example:sales-center:delivery-orders',
    ruleId: 'example-delivery-orders',
    subjectId: 'sales-center',
  },
  {
    id: 'departments-example:delivery:delivery-orders',
    ruleId: 'example-delivery-orders',
    subjectId: 'delivery',
  },
  // The Executive Office reviews the shared example projects.
  {
    id: 'departments-example:executive-office:selected-projects',
    ruleId: 'example-selected-projects',
    subjectId: 'executive-office',
  },
  // Delivery prepares the sales projects it is about to deliver.
  {
    id: 'departments-example:delivery:sales-projects',
    ruleId: 'departments-example-sales-projects',
    subjectId: 'delivery',
  },
];

/** The authorization example's confidentiality restrictions, company-wide through the root department. */
export const RESTRICTION_ASSIGNMENTS: readonly SeedRuleAssignment[] = [
  'example-public-authorizationExampleProjects',
  'example-public-authorizationExampleQuotes',
  'example-public-authorizationExampleOrders',
].map((ruleId) => ({
  // Assignment ids are at most 64 characters, so the rule key's shared prefix is left out of them. The seed
  // recognises an assignment it already wrote by rule and subject, not by id.
  id: `departments-example:trading:${ruleId.replace(/^example-public-/, '')}`,
  ruleId,
  subjectId: 'trading',
}));

export interface DemoMembership {
  readonly departmentId: string;
  readonly primary: boolean;
}

export interface DemoAccount {
  readonly name: string;
  readonly email: string;
  readonly memberships: readonly DemoMembership[];
  /** The person's job role, assigned to the user directly on top of what the departments pass down. */
  readonly permissionSets?: readonly string[];
  /** Departments this person heads. */
  readonly heads?: readonly string[];
}

/** Fictional accounts for practice; they share {@link DEMO_PASSWORD}. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    name: 'Grace Zhou',
    email: 'grace@departments.example',
    memberships: [{ departmentId: 'executive-office', primary: true }],
    permissionSets: [SALES_SETS.manager],
  },
  {
    name: 'Leo Wang',
    email: 'leo@departments.example',
    memberships: [{ departmentId: 'north-sales', primary: true }],
    permissionSets: [SALES_SETS.engineer],
  },
  {
    name: 'Nina Li',
    email: 'nina@departments.example',
    memberships: [{ departmentId: 'north-sales', primary: true }],
  },
  {
    name: 'Chen Chen',
    email: 'chen@departments.example',
    memberships: [
      { departmentId: 'south-sales', primary: true },
      { departmentId: 'delivery', primary: false },
    ],
  },
  {
    name: 'Eric Liu',
    email: 'eric@departments.example',
    memberships: [{ departmentId: 'south-sales', primary: true }],
    permissionSets: [SALES_SETS.engineer],
  },
  {
    name: 'Mia Zhao',
    email: 'mia@departments.example',
    memberships: [{ departmentId: 'delivery', primary: true }],
  },
  {
    name: 'Sophia Sun',
    email: 'sophia@departments.example',
    memberships: [{ departmentId: 'sales-center', primary: true }],
    heads: ['sales-center'],
  },
  {
    name: 'Owen Xu',
    email: 'owen@departments.example',
    memberships: [{ departmentId: 'north-sales', primary: true }],
    heads: ['north-sales'],
  },
];

export const DEMO_PASSWORD = 'departments-demo';

/** The region the organisation gives an account at seed time: its primary regional department's, else another's. */
export function seedRegionOf(account: DemoAccount): string | null {
  const regions = [...account.memberships]
    .sort((left, right) => Number(right.primary) - Number(left.primary))
    .map(
      (membership) =>
        SEED_DEPARTMENTS.find((item) => item.id === membership.departmentId)
          ?.region ?? null,
    )
    .filter((region): region is string => region !== null);
  return regions[0] ?? null;
}
