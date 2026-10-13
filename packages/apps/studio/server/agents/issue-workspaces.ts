/**
 * Whether the work on an issue is over, so runners remove the working directories they keep for it
 * (`SubjectBinding.workspaces`).
 *
 * It is over when the issue is Done or Cancelled, whatever its pull requests are: a runner may then remove clean directories
 * only after proving all local work published. Unpushed or uncertain work is preserved; reopening reuses its actual Git state. An issue that is gone or deleted
 * keeps its directories. While a run on the issue has not finished, the agents plugin keeps them too.
 *
 * A directory a runner kept from before it recorded runs, or whose run is gone, is named by the issue's key
 * (`resolveKeys`): only a key naming an issue Studio still has resolves. The project manager's directory for an issue
 * is named by the key with `.manager` after it (`managerWorkspaceKey`), and resolves to the same issue.
 */
import { isTerminalCategory } from '@nocobase/app-plugin-projects/shared/statuses';

import type { SubjectWorkspaces } from '@nocobase/app-plugin-agents/server/tokens';

import { categoriesOf, findIssues } from '../previews/sources.js';

const MANAGER_SUFFIX = '.manager';

/** The issue key a directory key names: the key itself, or the key before `.manager`. */
function issueKeyOf(key: string): string {
  return key.endsWith(MANAGER_SUFFIX)
    ? key.slice(0, -MANAGER_SUFFIX.length)
    : key;
}

export function issueWorkspaces(): SubjectWorkspaces {
  return {
    async resolveKeys(conn, keys) {
      const resolved = new Map<string, string[]>();
      const wanted = [
        ...new Set(keys.map(issueKeyOf).filter((key) => key !== '')),
      ];
      if (wanted.length === 0) return resolved;
      const rows = await conn.query
        .selectFrom('pmIssues')
        .select(['id', 'identifier'])
        .where('identifier', 'in', wanted)
        .where('deletedAt', 'is', null)
        .execute<{ id: unknown; identifier: unknown }>();
      const ids = new Map<string, string[]>();
      for (const row of rows) {
        const key = String(row.identifier);
        ids.set(key, [...(ids.get(key) ?? []), String(row.id)].sort());
      }
      for (const key of keys) {
        const found = ids.get(issueKeyOf(key));
        if (found) resolved.set(key, found);
      }
      return resolved;
    },

    async settled(conn, subjectIds) {
      const settled = new Set<string>();
      const issues = (await findIssues(conn, subjectIds)).filter(
        (issue) => !issue.deleted,
      );
      const categories = categoriesOf();
      for (const issue of issues)
        if (isTerminalCategory(categories.get(issue.statusKey) ?? null))
          settled.add(issue.id);
      return settled;
    },
  };
}
