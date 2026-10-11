import { useNotify } from '@nocobase/app-plugin-projects/client/issues';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { useQueryClient } from '@tanstack/react-query';

import type {
  DependencyItem,
  RelationshipType,
} from '@/extensions/nocobase-issue-detail/issue-detail';

/** Studio's relationship picker uses the public API; the plugin's addBlocker action intentionally only blocks. */
export function useDependencyActions(issueId: string) {
  const api = usePmApi();
  const notify = useNotify();
  const queries = useQueryClient();
  const run = async (action: () => Promise<unknown>): Promise<void> => {
    try {
      await action();
    } catch (error: unknown) {
      notify.error(error);
      throw error;
    } finally {
      // Include both endpoints, their identifier aliases, and lists after success or a stale-state conflict.
      await Promise.all([
        queries.invalidateQueries({ queryKey: ['pm', 'issue'] }),
        queries.invalidateQueries({ queryKey: pmKeys.issues }),
      ]);
    }
  };
  return {
    add: (otherId: string, type: RelationshipType) =>
      run(() =>
        api.addDependency(issueId, { dependsOnIssueId: otherId, type }),
      ),
    change: (dependency: DependencyItem, type: RelationshipType) =>
      run(() =>
        api.updateDependency(issueId, dependency.id, {
          type,
          expectedType: type === 'blockedBy' ? 'relatedTo' : 'blockedBy',
        }),
      ),
  };
}
