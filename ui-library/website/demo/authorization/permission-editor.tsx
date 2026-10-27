import { useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';

import {
  PermissionEditor,
  type PermissionEditorLevel,
  type PermissionEditorSection,
  type PermissionEditorScope,
  type PermissionEditorNavigationNode,
} from '#components/permission-editor';

const OWN_OR_ALL: readonly PermissionEditorLevel[] = [
  { value: '', label: 'Use default rules' },
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
  readonly description?: string;
  readonly groups: readonly DemoGroup[];
  readonly navigation?: readonly PermissionEditorNavigationNode[];
}[] = [
  {
    id: 'actions',
    title: 'Business operations',
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
            hint: 'Submit an eligible quote after checking its linked project.',
            scopes: [
              {
                id: 'quote-projects',
                label: 'Linked projects',
                levels: OWN_OR_ALL,
                level: '',
                hint: 'This role adds no records. Effective access also depends on other roles and default, sharing and restriction rules.',
              },
              {
                id: 'quote-records',
                label: 'Quotes allowed for submission',
                levels: OWN_OR_ALL,
                level: '',
                hint: 'This role adds no records. Effective access also depends on other roles and default, sharing and restriction rules.',
              },
            ],
          },
          {
            id: 'quotes-create',
            label: 'Create quote',
            hint: 'Prepare a draft quotation.',
          },
          {
            id: 'quotes-withdraw',
            label: 'Withdraw quote',
            hint: 'Withdraw an unprocessed quotation.',
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
    description:
      'Choose business pages. System settings and their actions are controlled under Configuration permissions.',
    navigation: [
      { id: 'dashboard', label: 'Dashboard', rowId: 'page-dashboard' },
      {
        id: 'sales-menu',
        label: 'Sales',
        children: [
          {
            id: 'pipeline-menu',
            label: 'Pipeline',
            rowId: 'page-pipeline',
            children: [
              { id: 'deals-menu', label: 'Deals', rowId: 'page-deals' },
              {
                id: 'contacts-menu',
                label: 'Contacts',
                rowId: 'page-contacts',
              },
            ],
          },
          {
            id: 'reports-menu',
            label: 'Reports',
            children: [
              {
                id: 'forecast-menu',
                label: 'Forecast',
                rowId: 'page-forecast',
              },
            ],
          },
        ],
      },
    ],
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
    title: 'Configuration permissions',
    description:
      'Control access and actions for the system settings this application exposes.',
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
  const [saved, setSaved] = useState({
    enabled: INITIAL_ENABLED,
    levels: INITIAL_LEVELS,
  });
  const [savedNotice, setSavedNotice] = useState(false);
  const dirty = JSON.stringify({ enabled, levels }) !== JSON.stringify(saved);
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
      <div className='mx-auto grid max-w-6xl gap-4'>
        <p className='text-sm text-muted-foreground'>
          Example application permissions. Changes take effect after Save.
        </p>
        <PermissionEditor
          sections={sections}
          onEnabledChange={(id, on) =>
            setEnabled((current) => ({ ...current, [id]: on }))
          }
          onLevelChange={(id, level) =>
            setLevels((current) => ({ ...current, [id]: level }))
          }
        />
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <span role='status' className='mr-auto text-xs text-muted-foreground'>
            {dirty ? 'Unsaved changes' : savedNotice ? 'Example saved' : ''}
          </span>
          <Button
            type='button'
            variant='outline'
            disabled={!dirty}
            onClick={() => {
              setEnabled(saved.enabled);
              setLevels(saved.levels);
              setSavedNotice(false);
            }}
          >
            Discard changes
          </Button>
          <Button
            type='button'
            disabled={!dirty}
            onClick={() => {
              setSaved({ enabled, levels });
              setSavedNotice(true);
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
