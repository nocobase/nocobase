/**
 * The page context kinds Studio's pages reference, resolved for the conversation's owner (`PageContextKinds`): issues
 * and projects through the projects plugin's own queries, as that person sees them, and inbox items through Studio's
 * inbox, the person's own only. A reference the person may not see is left out, so it never tells them that something
 * they may not see exists.
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import type { PageContextResolver } from '@nocobase/app-plugin-agents/server/tokens';
import type { ResolvedRef } from '@nocobase/app-plugin-agents/server/tokens';
import type { PermissionSource } from '../commands/permissions.js';
import type { InboxSource } from './inbox.js';

/** The kinds Studio's pages put in a page context. */
export const PAGE_CONTEXT_KINDS = ['issue', 'project', 'inboxItem'] as const;

export type StudioPageContextKind = (typeof PAGE_CONTEXT_KINDS)[number];

export function issueUrl(identifier: string): string {
  return `/issues/${encodeURIComponent(identifier)}`;
}

export function projectUrl(id: string): string {
  return `/projects/${encodeURIComponent(id)}`;
}

export function pageContextResolvers(deps: {
  readonly projects: () => Pick<Projects, 'issueQueries' | 'projects'>;
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
  readonly inbox: () => InboxSource | undefined;
}): Readonly<Record<StudioPageContextKind, PageContextResolver>> {
  const viewerOf = (userId: string) =>
    deps.permissions.viewerOf({ kind: 'user', userId, displayName: userId });
  return {
    async issue(_conn, userId, ids) {
      const viewer = await viewerOf(userId);
      const found = new Map<string, ResolvedRef>();
      for (const id of ids) {
        const issue = await deps
          .projects()
          .issueQueries.detail(viewer, id)
          .catch(() => null);
        if (issue)
          found.set(id, {
            title: issue.title,
            key: issue.identifier,
            url: issueUrl(issue.identifier),
          });
      }
      return found;
    },
    async project(_conn, userId, ids) {
      const viewer = await viewerOf(userId);
      const found = new Map<string, ResolvedRef>();
      for (const id of ids) {
        const project = await deps
          .projects()
          .projects.get(viewer, id)
          .catch(() => null);
        if (project)
          found.set(id, {
            title: project.name,
            key: null,
            url: projectUrl(project.id),
          });
      }
      return found;
    },
    async inboxItem(_conn, userId, ids) {
      const source = deps.inbox();
      if (!source) return new Map();
      const items = await source.find(userId, ids);
      return new Map(
        [...items].map(([id, item]): [string, ResolvedRef] => [
          id,
          {
            title: item.title,
            key: item.issueIdentifier,
            url: item.url,
          },
        ]),
      );
    },
  };
}
