/**
 * What an API key's scope may hold in Studio: the permission groups each assembled plugin declares in its
 * `shared/access`, and Studio's own. The plugins do not know each other; this is where their declarations meet. The
 * server registers them with the API keys plugin (`server/access/key-scopes.ts`), each business action checked at
 * every level the plugin registered it at.
 *
 * Every business action and settings capability of the catalog is annotated for keys (`action-policy.ts`): covered by
 * a group here, or with the reason it is a person's; the catalog test checks the two agree.
 */
import * as agents from '@nocobase/app-plugin-agents/shared/access';
import * as projects from '@nocobase/app-plugin-projects/shared/access';
import * as releases from '@nocobase/app-plugin-releases/shared/access';

import { STUDIO_NAMESPACE } from '../../shared/access.js';

const text = (key: string) => ({ key, ns: STUDIO_NAMESPACE });

type Level = 'read' | 'write' | 'admin';

type Access =
  | { readonly kind: 'page'; readonly id: string }
  | { readonly kind: 'settings'; readonly id: string; readonly action: string }
  | { readonly kind: 'business'; readonly id: string; readonly action: string };

/** A group as a plugin declares it (the API keys plugin's `KeyScopeGroupDeclaration`). */
export interface KeyScopeGroup {
  readonly id: string;
  readonly category: 'business' | 'administration' | 'account';
  readonly title: string | { readonly key: string; readonly ns: string };
  readonly description?: string | { readonly key: string; readonly ns: string };
  readonly levels: Readonly<Partial<Record<Level, readonly Access[]>>>;
  readonly objects?: {
    readonly business: string;
    readonly title: string | { readonly key: string; readonly ns: string };
    readonly allowsUnscoped?: readonly Access[];
  };
}

/** A preset as a plugin declares it (the API keys plugin's `KeyScopePresetDeclaration`). */
export interface KeyScopePreset {
  readonly id: string;
  readonly title: string | { readonly key: string; readonly ns: string };
  readonly description?: string | { readonly key: string; readonly ns: string };
  readonly groups: Readonly<
    Record<string, { readonly level: Level; readonly objects?: 'all' | 'pick' }>
  >;
  readonly expiresInDays?: number | null;
}

/**
 * Studio's own groups: members and roles (the `pm.members` settings item, which Studio's role pages use), reports, and
 * the knowledge base (reading is `read`, proposing `write`, editing and the system knowledge page `admin`). Inviting
 * and giving roles is `write`; defining roles is `admin`.
 */
export const STUDIO_KEY_SCOPE_GROUPS: readonly KeyScopeGroup[] = [
  {
    id: 'studio.members',
    category: 'administration',
    title: text('keyScopes.members.title'),
    description: text('keyScopes.members.description'),
    levels: {
      read: [{ kind: 'settings', id: 'pm.members', action: 'read' }],
      write: [
        { kind: 'settings', id: 'pm.members', action: 'invite' },
        { kind: 'settings', id: 'pm.members', action: 'assign' },
      ],
      admin: [{ kind: 'settings', id: 'pm.members', action: 'define-roles' }],
    },
  },
  {
    id: 'studio.reports',
    category: 'business',
    title: text('keyScopes.reports.title'),
    description: text('keyScopes.reports.description'),
    // The dashboard and metrics (Studio's), and the usage page (the agents plugin's API).
    levels: {
      read: [
        { kind: 'page', id: 'reports' },
        { kind: 'page', id: 'usage' },
      ],
    },
  },
  {
    id: 'studio.knowledge',
    category: 'business',
    title: text('keyScopes.knowledge.title'),
    description: text('keyScopes.knowledge.description'),
    levels: {
      read: [{ kind: 'business', id: 'kb.knowledge', action: 'read' }],
      write: [{ kind: 'business', id: 'kb.knowledge', action: 'propose' }],
      admin: [
        { kind: 'business', id: 'kb.knowledge', action: 'edit' },
        { kind: 'business', id: 'kb.knowledge', action: 'manage' },
        { kind: 'page', id: 'knowledge' },
      ],
    },
  },
];

/** The declarations in the order the key editor lists them. */
export const KEY_SCOPE_DECLARATIONS: readonly {
  readonly groups: readonly KeyScopeGroup[];
  readonly presets?: readonly KeyScopePreset[];
}[] = [
  {
    groups: projects.KEY_SCOPE_GROUPS,
    presets: projects.KEY_SCOPE_PRESETS,
  },
  { groups: agents.KEY_SCOPE_GROUPS },
  {
    groups: releases.KEY_SCOPE_GROUPS,
    presets: releases.KEY_SCOPE_PRESETS,
  },
  { groups: STUDIO_KEY_SCOPE_GROUPS },
];

/** Every group, in editor order. */
export const KEY_SCOPE_GROUPS: readonly KeyScopeGroup[] =
  KEY_SCOPE_DECLARATIONS.flatMap((declaration) => declaration.groups);

/** "Read only": every group at read, over every record. */
export const READ_ONLY_PRESET: KeyScopePreset = {
  id: 'read-only',
  title: text('keyScopes.presets.readOnly.title'),
  description: text('keyScopes.presets.readOnly.description'),
  groups: Object.fromEntries(
    KEY_SCOPE_GROUPS.filter((group) => group.levels.read).map((group) => [
      group.id,
      { level: 'read' as const },
    ]),
  ),
};
