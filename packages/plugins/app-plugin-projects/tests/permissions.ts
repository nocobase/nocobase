/** The permissions of the three kinds of viewer the tests use, as the seeded roles give them. */
import {
  BUSINESS_KEYS,
  SETTINGS_KEYS,
  type BusinessKey,
  type Permissions,
  type Scope,
  type SettingsKey,
} from '../shared/access.js';

export type Role = 'admin' | 'member' | 'none';

/**
 * The levels Acme's roles seed gives `contributor` (`acme/database/main/seeds/202610010022_acme_roles.ts`);
 * `related` reaches the viewer alone.
 */
const MEMBER_SCOPES: Readonly<Record<BusinessKey, 'all' | 'related' | 'none'>> =
  {
    'pm.projects/view': 'related',
    'pm.projects/create': 'all',
    'pm.projects/manage': 'related',
    'pm.projects/delete': 'none',
    'pm.issues/view': 'related',
    'pm.issues/create': 'related',
    'pm.issues/edit': 'related',
    'pm.issues/comment': 'related',
    'pm.issues/moderate-comments': 'related',
    'pm.issues/close': 'related',
    'pm.issues/change-owner': 'related',
    'pm.issues/delete': 'none',
    'pm.attachments/upload': 'related',
  };

/** What `userId` may do in `role`. */
export function permissionsOf(role: Role, userId: string): Permissions {
  const scopeOf = (key: BusinessKey): Scope => {
    if (role === 'admin') return 'all';
    if (role === 'none') return 'none';
    const level = MEMBER_SCOPES[key];
    return level === 'related' ? { users: [userId] } : level;
  };
  const scopes = Object.fromEntries(
    BUSINESS_KEYS.map(({ key }) => [key, scopeOf(key)]),
  ) as Record<BusinessKey, Scope>;
  const settings = Object.fromEntries(
    SETTINGS_KEYS.map(({ action, key }) => [
      key,
      role === 'admin' || (role === 'member' && action === 'read'),
    ]),
  ) as Record<SettingsKey, boolean>;
  return { scopes, settings };
}
