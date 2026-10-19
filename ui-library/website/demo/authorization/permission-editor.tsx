import { useState, type ReactElement } from 'react';

import {
  PermissionEditor,
  type PermissionEditorLevel,
  type PermissionEditorSection,
  type PermissionEditorScope,
} from '#components/permission-editor';

const OWN_OR_ALL: readonly PermissionEditorLevel[] = [
  { value: 'own', label: 'Their own records' },
  { value: 'all', label: 'All records' },
];

const ALL_ONLY: readonly PermissionEditorLevel[] = [
  { value: 'all', label: 'All records' },
];

const VIEW_OR_MANAGE: readonly PermissionEditorLevel[] = [
  { value: 'view', label: 'View' },
  { value: 'manage', label: 'Manage' },
];

interface DemoRow {
  readonly id: string;
  readonly label: string;
  readonly actionKey?: string | undefined;
  readonly hint?: string;
  readonly levels?: readonly PermissionEditorLevel[];
  readonly scopes?: readonly PermissionEditorScope[];
  /** A hint per level, for a settings item whose levels mean different things. */
  readonly hints?: Readonly<Record<string, string>>;
}

interface DemoGroup {
  readonly id: string;
  readonly title?: string;
  readonly rows: readonly DemoRow[];
}

const CATALOG: readonly {
  readonly id: string;
  readonly title: string;
  readonly footer?: string;
  readonly groups: readonly DemoGroup[];
}[] = [
  {
    id: 'actions',
    title: 'Business actions',
    footer:
      'Their own records are the ones they own or are assigned to; all records include everyone else’s.',
    groups: [
      {
        id: 'deals',
        title: 'Deals',
        rows: [
          {
            id: 'deals-view',
            actionKey: 'read',
            label: 'View deals',
            hint: 'Open deals and their history',
            levels: OWN_OR_ALL,
          },
          {
            id: 'deals-edit',
            actionKey: 'update',
            label: 'Edit deals',
            hint: 'Change the amount, stage and close date',
            levels: OWN_OR_ALL,
          },
          {
            id: 'deals-delete',
            actionKey: 'delete',
            label: 'Delete deals',
            hint: 'Remove a deal for good',
            levels: ALL_ONLY,
          },
        ],
      },
      {
        id: 'quotes',
        title: 'Quotes',
        rows: [
          {
            id: 'quotes-submit',
            actionKey: 'submit',
            label: 'Submit quote',
            scopes: [
              {
                id: 'quote-projects',
                label: 'Linked projects',
                levels: OWN_OR_ALL,
                level: 'own',
              },
              {
                id: 'quote-records',
                label: 'Quotes allowed for submission',
                levels: OWN_OR_ALL,
                level: 'all',
              },
            ],
          },
        ],
      },
      {
        id: 'contacts',
        title: 'Contacts',
        rows: [
          {
            id: 'contacts-view',
            actionKey: 'read',
            label: 'View contacts',
            levels: OWN_OR_ALL,
          },
          {
            id: 'contacts-export',
            actionKey: 'export',
            label: 'Export contacts',
            hint: 'Download contacts as a spreadsheet',
            levels: ALL_ONLY,
          },
        ],
      },
    ],
  },
  {
    id: 'pages',
    title: 'Page access',
    groups: [
      {
        id: 'home',
        rows: [{ id: 'page-dashboard', label: 'Dashboard' }],
      },
      {
        id: 'sales',
        title: 'Sales',
        rows: [
          { id: 'page-pipeline', label: 'Pipeline' },
          { id: 'page-deals', label: 'Deals' },
          { id: 'page-contacts', label: 'Contacts' },
        ],
      },
      {
        id: 'reports',
        title: 'Reports',
        rows: [{ id: 'page-forecast', label: 'Forecast' }],
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    groups: [
      {
        id: 'roles',
        title: 'Roles',
        rows: [
          { id: 'roles-read', actionKey: 'read', label: 'View' },
          { id: 'roles-create', actionKey: 'create', label: 'Create' },
          { id: 'roles-update', actionKey: 'update', label: 'Edit' },
          { id: 'roles-delete', actionKey: 'delete', label: 'Delete' },
          { id: 'roles-grants', actionKey: 'grants', label: 'Manage grants' },
        ],
      },
      ...['Default data scope', 'Sharing rules', 'Restriction rules'].map(
        (title, index) => ({
          id: `policy-${index}`,
          title,
          rows: [
            { id: `policy-${index}-read`, actionKey: 'read', label: 'View' },
            {
              id: `policy-${index}-create`,
              actionKey: 'create',
              label: 'Create',
            },
            {
              id: `policy-${index}-update`,
              actionKey: 'update',
              label: 'Edit',
            },
            {
              id: `policy-${index}-delete`,
              actionKey: 'delete',
              label: 'Delete',
            },
          ],
        }),
      ),
      {
        id: 'checker',
        title: 'Permission checker',
        rows: [{ id: 'check', actionKey: 'check', label: 'Check permissions' }],
      },
      {
        id: 'scheduler',
        title: 'Scheduler',
        rows: [
          {
            id: 'scheduler-run',
            actionKey: 'run',
            label: 'Start and stop rules',
          },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    footer: 'Only people who can define roles may change this page.',
    groups: [
      {
        id: 'stages',
        rows: [
          {
            id: 'settings-stages',
            label: 'Pipeline stages',
            levels: VIEW_OR_MANAGE,
            hints: {
              view: 'See the stages and their order',
              manage: 'Add, rename and reorder stages',
            },
          },
        ],
      },
      {
        id: 'team',
        title: 'Team',
        rows: [
          { id: 'settings-team-read', label: 'See who is on the team' },
          { id: 'settings-team-invite', label: 'Invite people' },
          { id: 'settings-team-roles', label: 'Define roles' },
        ],
      },
    ],
  },
];

const INITIAL_ENABLED: Readonly<Record<string, boolean>> = {
  'deals-view': true,
  'quotes-submit': true,
  'deals-edit': true,
  'contacts-view': true,
  'page-dashboard': true,
  'page-pipeline': true,
  'page-deals': true,
  'settings-stages': true,
  'settings-team-read': true,
};

const INITIAL_LEVELS: Readonly<Record<string, string>> = {
  'deals-view': 'all',
  'deals-edit': 'own',
  'contacts-view': 'own',
  'settings-stages': 'view',
};

export function PermissionEditorDemo(): ReactElement {
  const [enabled, setEnabled] = useState(INITIAL_ENABLED);
  const [levels, setLevels] = useState(INITIAL_LEVELS);
  const sections: readonly PermissionEditorSection[] = CATALOG.map(
    (section) => ({
      ...section,
      groups: section.groups.map((group) => ({
        ...group,
        rows: group.rows.map((row) => {
          const level = levels[row.id] ?? row.levels?.[0]?.value;
          return {
            id: row.id,
            label: row.label,
            actionKey: row.actionKey,
            hint: row.hints && level ? row.hints[level] : row.hint,
            enabled: enabled[row.id] ?? false,
            levels: row.levels,
            scopes: row.scopes?.map((scope) => ({
              ...scope,
              level: levels[scope.id] ?? scope.level,
            })),
            level,
          };
        }),
      })),
    }),
  );
  return (
    <div className='min-h-svh bg-background p-6 text-foreground'>
      <div className='mx-auto max-w-6xl'>
        <PermissionEditor
          sections={sections}
          onEnabledBatchChange={(changes) =>
            setEnabled((current) => ({
              ...current,
              ...Object.fromEntries(
                changes.map((change) => [change.id, change.enabled]),
              ),
            }))
          }
          onEnabledChange={(id, on) =>
            setEnabled((current) => ({ ...current, [id]: on }))
          }
          onLevelChange={(id, level) =>
            setLevels((current) => ({ ...current, [id]: level }))
          }
        />
      </div>
    </div>
  );
}
