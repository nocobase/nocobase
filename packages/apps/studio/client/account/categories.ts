/**
 * The categories of the person's settings, opened in the account settings dialog (`account-dialog.tsx`, deep links
 * `/account/<id>`), in the order its sidebar shows them, under their groups. Each page loads when it is first opened.
 */
import {
  GitBranch,
  KeyRound,
  Palette,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { lazy, type ComponentType } from 'react';

/** The dialog sidebar's groups, in order, as locale keys of their labels. */
export const ACCOUNT_CATEGORY_GROUPS = {
  account: 'accountSettings.groups.account',
  integrations: 'accountSettings.groups.integrations',
} as const;

export interface AccountCategory {
  /** The sidebar group the category is listed under. */
  readonly group: keyof typeof ACCOUNT_CATEGORY_GROUPS;
  /** The URL segment, unique: `/account/<id>`. */
  readonly id: string;
  /** Locale keys of the title (in the list and above the content) and the description. */
  readonly title: string;
  readonly description?: string;
  /** False when the component draws its own heading; the page then shows only the content. */
  readonly heading?: boolean;
  readonly icon: ComponentType<{ readonly className?: string }>;
  readonly component: ComponentType;
}

export const ACCOUNT_CATEGORIES: readonly AccountCategory[] = [
  {
    id: 'profile',
    group: 'account',
    title: 'accountSettings.categories.profile.title',
    description: 'accountSettings.categories.profile.description',
    icon: UserRound,
    component: lazy(() => import('../pages/account/profile.js')),
  },
  {
    id: 'security',
    group: 'account',
    title: 'accountSettings.categories.security.title',
    description: 'accountSettings.categories.security.description',
    icon: ShieldCheck,
    component: lazy(() => import('../pages/account/security.js')),
  },
  {
    id: 'preferences',
    group: 'account',
    title: 'accountSettings.categories.preferences.title',
    description: 'accountSettings.categories.preferences.description',
    icon: Palette,
    component: lazy(() => import('../pages/account/preferences.js')),
  },
  {
    // The list itself, with its own heading and description (`pages/account/api-keys.tsx`).
    id: 'api-keys',
    group: 'integrations',
    title: 'accountSettings.categories.apiKeys.title',
    heading: false,
    icon: KeyRound,
    component: lazy(() => import('../pages/account/api-keys.js')),
  },
  {
    // The person's own GitHub authorization (`pages/account/git.tsx`). Always listed: without a GitHub App to
    // authorize through, the page says an administrator adds one first.
    id: 'git',
    group: 'integrations',
    title: 'accountSettings.categories.git.title',
    description: 'accountSettings.categories.git.description',
    icon: GitBranch,
    component: lazy(() => import('../pages/account/git.js')),
  },
];

/** The search parameter that opens the dialog over the current page: `?account=<category id>`. */
export const ACCOUNT_PARAM = 'account';

/** `search` with the dialog opened on `category`, or closed when it is null. */
export function withAccountCategory(
  search: string,
  category: string | null,
): string {
  const params = new URLSearchParams(search);
  if (category === null) params.delete(ACCOUNT_PARAM);
  else params.set(ACCOUNT_PARAM, category);
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}

/** The category `id` names, or the first one. */
export function accountCategory(id: string | null): AccountCategory {
  return (
    ACCOUNT_CATEGORIES.find((category) => category.id === id) ??
    ACCOUNT_CATEGORIES[0]
  );
}
