import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { SettingsItem } from '@nocobase/app-plugin-projects/shared/access';
import {
  canUseSetting,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import {
  GitBranch,
  KeyRound,
  Search,
  Settings2,
  ShieldCheck,
  Tag,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

/** One page of the workspace settings (`/config/<path>`), behind the `read` capability of its settings item. */
export interface SettingsSection {
  readonly path: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export interface SettingsSectionGroup {
  readonly id: string;
  readonly label: string;
  readonly sections: readonly SettingsSection[];
}

type Item =
  SettingsItem | 'studio.apiKeys' | 'studio.git' | 'studio.knowledgeSearch';

/**
 * The settings menu, in the order the sidebar shows it. The projects plugin's items come with the viewer
 * (`useViewer`); Studio's own (`studio.apiKeys`, `studio.git`, `studio.knowledgeSearch`) are checked with `useCan`. The agents plugin's pages and
 * the models are not settings: they are the Agent team section.
 */
const GROUPS: readonly {
  readonly id: string;
  readonly label: string;
  readonly sections: readonly (SettingsSection & { readonly item: Item })[];
}[] = [
  {
    id: 'workspace',
    label: 'config.nav.groups.workspace',
    sections: [
      {
        path: 'general',
        item: 'pm.general',
        label: 'config.nav.general',
        icon: Settings2,
      },
      {
        path: 'labels',
        item: 'pm.labels',
        label: 'config.nav.labels',
        icon: Tag,
      },
      {
        path: 'knowledge-search',
        item: 'studio.knowledgeSearch',
        label: 'config.nav.knowledgeSearch',
        icon: Search,
      },
    ],
  },
  {
    id: 'access',
    label: 'config.nav.groups.access',
    sections: [
      {
        path: 'members',
        item: 'pm.members',
        label: 'config.nav.members',
        icon: Users,
      },
      {
        path: 'roles',
        item: 'pm.members',
        label: 'config.nav.roles',
        icon: ShieldCheck,
      },
      {
        path: 'api-keys',
        item: 'studio.apiKeys',
        label: 'config.nav.apiKeys',
        icon: KeyRound,
      },
    ],
  },
  {
    id: 'projects',
    label: 'config.nav.groups.projects',
    sections: [
      {
        path: 'workflows',
        item: 'pm.workflows',
        label: 'config.nav.workflows',
        icon: Workflow,
      },
    ],
  },
  {
    id: 'integrations',
    label: 'config.nav.groups.integrations',
    sections: [
      {
        path: 'git',
        item: 'studio.git',
        label: 'config.nav.git',
        icon: GitBranch,
      },
    ],
  },
];

/**
 * The settings groups the viewer may read, each with only its readable pages; a group left empty is dropped. `loading`
 * is true until the viewer's settings capabilities arrive. The routes check the same items.
 */
export function useSettingsSections(): {
  readonly loading: boolean;
  readonly groups: readonly SettingsSectionGroup[];
} {
  const viewer = useViewer();
  const apiKeys = useCan({
    resource: { type: 'settings', id: 'studio.apiKeys' },
    action: 'read',
  }).can;
  const git = useCan({
    resource: { type: 'settings', id: 'studio.git' },
    action: 'read',
  }).can;
  const knowledgeSearch = useCan({
    resource: { type: 'settings', id: 'studio.knowledgeSearch' },
    action: 'read',
  }).can;
  const readable = (item: Item): boolean =>
    item === 'studio.apiKeys'
      ? apiKeys
      : item === 'studio.git'
        ? git
        : item === 'studio.knowledgeSearch'
          ? knowledgeSearch
          : canUseSetting(viewer, item, 'read');
  const groups = GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    sections: group.sections
      .filter((section) => readable(section.item))
      .map(({ path, label, icon }) => ({ path, label, icon })),
  })).filter((group) => group.sections.length > 0);
  return { loading: !viewer, groups };
}

/** Whether `pathname` is in the workspace settings. */
export function isSettingsPath(pathname: string): boolean {
  return pathname === '/config' || pathname.startsWith('/config/');
}
