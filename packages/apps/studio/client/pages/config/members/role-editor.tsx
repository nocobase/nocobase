import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  PermissionEditor,
  type PermissionEditorGroup,
  type PermissionEditorRow,
  type PermissionEditorSection,
} from '@/components/permission-editor';

import type {
  AccessCatalog,
  CatalogBusinessAction,
  CatalogLevel,
  Level,
} from '../../../../shared/access.js';
import {
  businessGroups,
  catalogText,
  levelText,
  pageText,
  type RoleDraft,
  settingsGroups,
  settingsLevelOf,
  withSettingsLevel,
} from './roles-model.js';
import { PAGE_GROUPS } from './page-groups.js';

/** What a row's switch and level select do to the draft. */
interface RowHandlers {
  readonly toggle: (on: boolean) => RoleDraft;
  readonly level?: (value: string) => RoleDraft | null;
}

/**
 * What a role holds, in three sections: the business actions, each a switch and, for one with related records, how far
 * it reaches (the related records, worded by its plugin, or all), the pages it opens (as the sidebar lists them) and the
 * settings items, laid out alike. Pages and business actions are chosen separately: a role may act through the API
 * on what it has no page for. Maps the draft and the catalog the plugins registered onto the UI Library's
 * `PermissionEditor`, and its changes back onto the draft.
 */
export function RoleEditor({
  catalog,
  draft,
  readOnly,
  onChange,
}: {
  readonly catalog: AccessCatalog;
  readonly draft: RoleDraft;
  readonly readOnly: boolean;
  readonly onChange: (draft: RoleDraft) => void;
}): ReactElement {
  const { t } = useTranslation();
  const handlers = new Map<string, RowHandlers>();
  const row = (
    entry: PermissionEditorRow,
    rowHandlers: RowHandlers,
  ): PermissionEditorRow => {
    handlers.set(entry.id, rowHandlers);
    return entry;
  };
  const withSettings = (settings: RoleDraft['settings']): RoleDraft => ({
    ...draft,
    settings,
  });

  const levelLabel = (entry: CatalogLevel): string =>
    entry.level === 'related'
      ? catalogText(t, entry.label, t(levelText(entry.level)))
      : t(levelText(entry.level));

  const businessRow = (action: CatalogBusinessAction): PermissionEditorRow => {
    const { key } = action;
    const level = draft.abilities[key] ?? 'none';
    const offered = action.levels.map((entry) => entry.level);
    const related = action.levels.find((entry) => entry.level === 'related');
    const setLevel = (next: Level): RoleDraft => ({
      ...draft,
      abilities: { ...draft.abilities, [key]: next },
    });
    return row(
      {
        id: `studio-role-business-${key}`,
        label: catalogText(t, action.title, key),
        hint: action.description
          ? catalogText(t, action.description, '')
          : undefined,
        note: related?.description
          ? catalogText(t, related.description, '') || undefined
          : undefined,
        enabled: level !== 'none',
        // A single level is the switch itself.
        levels:
          offered.length > 1
            ? action.levels.map((entry) => ({
                value: entry.level,
                label: levelLabel(entry),
              }))
            : undefined,
        level: level === 'none' ? undefined : level,
      },
      {
        // Switched on, an action starts at its lowest level, as a settings item does.
        toggle: (on) => setLevel(on ? (offered[0] ?? 'all') : 'none'),
        level: (value) => {
          const next = offered.find((offer) => offer === value);
          return next ? setLevel(next) : null;
        },
      },
    );
  };

  const capabilityRow = (
    key: string,
    title: string,
    label: string,
    nested: boolean,
  ): PermissionEditorRow =>
    row(
      {
        id: `studio-role-settings-${key}`,
        label: nested ? title : label,
        hint: nested ? undefined : title,
        enabled: draft.settings[key] === true,
      },
      { toggle: (on) => withSettings({ ...draft.settings, [key]: on }) },
    );

  const settingsGroup = ({
    item,
    title,
    actions,
    keys,
    tiered,
  }: ReturnType<typeof settingsGroups>[number]): PermissionEditorGroup => {
    const label = catalogText(t, title, item);
    const actionTitle = (key: string): string => {
      const action = actions.find((entry) => entry.key === key);
      return catalogText(t, action?.title, action?.name ?? key);
    };
    if (tiered) {
      const level = settingsLevelOf(draft.settings, keys);
      const shown = level ?? keys[0];
      return {
        id: item,
        rows: [
          row(
            {
              id: `studio-role-settings-${item}`,
              label,
              hint: shown ? actionTitle(shown) : undefined,
              enabled: level !== null,
              levels: keys.map((key) => ({
                value: key,
                label: actionTitle(key),
              })),
              level: level ?? undefined,
            },
            {
              toggle: (on) =>
                withSettings(
                  withSettingsLevel(
                    draft.settings,
                    keys,
                    on ? (keys[0] ?? null) : null,
                  ),
                ),
              level: (value) => {
                const next = keys.find((key) => key === value);
                return next
                  ? withSettings(withSettingsLevel(draft.settings, keys, next))
                  : null;
              },
            },
          ),
        ],
      };
    }
    const [only] = keys;
    if (keys.length === 1 && only)
      return {
        id: item,
        rows: [capabilityRow(only, actionTitle(only), label, false)],
      };
    return {
      id: item,
      title: label,
      rows: keys.map((key) =>
        capabilityRow(key, actionTitle(key), label, true),
      ),
    };
  };

  const sections: readonly PermissionEditorSection[] = [
    {
      id: 'business',
      title: t('roles.groups.business'),
      groups: businessGroups(catalog).map((business) => ({
        id: business.id,
        title: catalogText(t, business.title, business.id),
        rows: business.actions.map(businessRow),
      })),
    },
    {
      id: 'pages',
      title: t('roles.groups.pages'),
      groups: PAGE_GROUPS.map((group) => ({
        id: group.title ?? '',
        title: group.title ? t(group.title) : undefined,
        rows: group.pages.map((page) =>
          row(
            {
              id: `studio-role-page-${page}`,
              label: t(pageText(page)),
              enabled: draft.pages.has(page),
            },
            {
              toggle: (on) => {
                const pages = new Set(draft.pages);
                if (on) pages.add(page);
                else pages.delete(page);
                return { ...draft, pages };
              },
            },
          ),
        ),
      })),
    },
    {
      id: 'settings',
      title: t('roles.groups.settings'),
      groups: settingsGroups(catalog).map(settingsGroup),
      footer: t('roles.defineRolesNote'),
    },
  ];

  return (
    <PermissionEditor
      sections={sections}
      readOnly={readOnly}
      labels={{ levelFor: (name) => t('roles.scopeFor', { name }) }}
      onEnabledChange={(id, on) => {
        const next = handlers.get(id)?.toggle(on);
        if (next) onChange(next);
      }}
      onLevelChange={(id, value) => {
        const next = handlers.get(id)?.level?.(value);
        if (next) onChange(next);
      }}
    />
  );
}
