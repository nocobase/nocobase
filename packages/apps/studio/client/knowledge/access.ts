/**
 * Who may do what in a Studio knowledge space, for the knowledge view's space access sheet: Studio's roles with what each
 * of read, propose, edit and manage gives in this space (`server/knowledge/access.ts` decides the same on the server), where the viewer's access comes
 * from, what "related" means here, and the way to the roles for someone who may define them. The roles are read only
 * by someone who may read the member settings; everyone else sees their own access and the rules.
 */
import type { KnowledgeAccessDetails } from '@nocobase/app-plugin-knowledge/client/pages';
import type { SpaceRef } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import {
  canUseSetting,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';

import { BUILT_IN_ROLES, type Level, type Role } from '../../shared/access.js';
import { PROJECT_SCOPE } from '../../shared/knowledge.js';
import { studioKeys, useStudioApi } from '../access/api.js';
import { roleTitle } from '../pages/config/members/roles-model.js';

type Action = 'read' | 'propose' | 'edit' | 'manage';
type Translate = (key: string, options?: Record<string, unknown>) => string;

/** What a role's level of an action gives in the space, as Studio's resolver reads it. */
export function knowledgeCell(
  t: Translate,
  project: boolean,
  action: Action,
  level: Level,
): { readonly reach: 'none' | 'related' | 'all'; readonly label: string } {
  const none = { reach: 'none', label: t('knowledge.access.no') } as const;
  if (level === 'none') return none;
  if (action === 'edit' || action === 'manage') {
    if (level === 'all')
      return { reach: 'all', label: t('knowledge.access.everywhere') };
    return project
      ? { reach: 'related', label: t('knowledge.access.lead') }
      : none;
  }
  // Reading and proposing reach every system document, and a project's to whoever sees the project.
  return project
    ? { reach: 'related', label: t('knowledge.access.seesProject') }
    : { reach: 'all', label: t('knowledge.access.everyone') };
}

export function useKnowledgeAccessDetails(
  space: SpaceRef,
): KnowledgeAccessDetails {
  const { t } = useTranslation();
  const api = useStudioApi();
  const viewer = useViewer();
  const readsRoles = canUseSetting(viewer, 'pm.members', 'read');
  const me = useQuery({ queryKey: studioKeys.me, queryFn: () => api.me() });
  const roles = useQuery({
    queryKey: studioKeys.roles,
    queryFn: () => api.roles(),
    enabled: readsRoles,
  });
  const project = space.scope === PROJECT_SCOPE;
  const mine = new Set(me.data?.roles ?? []);
  const titleOf = (key: string, role?: Role) =>
    role
      ? roleTitle(t, role)
      : BUILT_IN_ROLES.includes(key)
        ? t(`roles.${key}`, { defaultValue: key })
        : key;
  const held = (me.data?.roles ?? []).map((key) =>
    titleOf(
      key,
      roles.data?.find((role) => role.key === key),
    ),
  );
  return {
    ...(held.length > 0
      ? { source: t('knowledge.access.source', { roles: held.join(', ') }) }
      : {}),
    ...(roles.data
      ? {
          rows: roles.data.map((role) => ({
            id: role.key,
            title: roleTitle(t, role),
            mine: mine.has(role.key),
            cells: {
              read: knowledgeCell(
                t,
                project,
                'read',
                role.abilities['kb.knowledge/read'],
              ),
              propose: knowledgeCell(
                t,
                project,
                'propose',
                role.abilities['kb.knowledge/propose'],
              ),
              edit: knowledgeCell(
                t,
                project,
                'edit',
                role.abilities['kb.knowledge/edit'],
              ),
              manage: knowledgeCell(
                t,
                project,
                'manage',
                role.abilities['kb.knowledge/manage'],
              ),
            },
          })),
        }
      : {}),
    related: project
      ? [
          t('knowledge.access.projectRead'),
          t('knowledge.access.projectEdit'),
          t('knowledge.access.projectManage'),
        ]
      : [
          t('knowledge.access.systemRead'),
          t('knowledge.access.systemEdit'),
          t('knowledge.access.systemManage'),
        ],
    ...(canUseSetting(viewer, 'pm.members', 'define-roles')
      ? { manage: { href: '/config/roles' } }
      : {}),
  };
}
