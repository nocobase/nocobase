import { useState, type ReactElement } from 'react';

import {
  PermissionEditor,
  type PermissionEditorLevel,
  type PermissionEditorSection,
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
  readonly hint?: string;
  readonly levels?: readonly PermissionEditorLevel[];
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
            label: 'View deals',
            hint: 'Open deals and their history',
            levels: OWN_OR_ALL,
          },
          {
            id: 'deals-edit',
            label: 'Edit deals',
            hint: 'Change the amount, stage and close date',
            levels: OWN_OR_ALL,
          },
          {
            id: 'deals-delete',
            label: 'Delete deals',
            hint: 'Remove a deal for good',
            levels: ALL_ONLY,
          },
        ],
      },
      {
        id: 'contacts',
        title: 'Contacts',
        rows: [
          {
            id: 'contacts-view',
            label: 'View contacts',
            levels: OWN_OR_ALL,
          },
          {
            id: 'contacts-export',
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
            hint: row.hints && level ? row.hints[level] : row.hint,
            enabled: enabled[row.id] ?? false,
            levels: row.levels,
            level,
          };
        }),
      })),
    }),
  );
  return (
    <div className='min-h-svh bg-background p-6 text-foreground'>
      <div className='mx-auto max-w-3xl'>
        <PermissionEditor
          sections={sections}
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
