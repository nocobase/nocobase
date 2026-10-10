import { useNotify } from '@nocobase/app-plugin-projects/client/issues';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { useQueryClient } from '@tanstack/react-query';

import type {
  DependencyItem,
  RelationshipType,
} from '@/extensions/nocobase-issue-detail/issue-detail';

type DependencyApi = Pick<
  ReturnType<typeof usePmApi>,
  'issue' | 'addDependency' | 'removeDependency'
>;

/** Establish the new relationship before removing the old one, so failed validation never loses the link. */
export async function changeRelationshipType(
  api: DependencyApi,
  issueId: string,
  dependency: Pick<DependencyItem, 'id' | 'issueId'>,
  type: RelationshipType,
): Promise<void> {
  const latest = await api.issue(issueId);
  const editable = [...latest.blockedBy, ...latest.relatedTo];
  const current = editable.find((item) => item.dependencyId === dependency.id);
  if (!current || current.type === type) return;
  // A previous attempt may have established the new type but failed to remove the old one.
  if (
    !editable.some(
      (item) => item.issueId === current.issueId && item.type === type,
    )
  ) {
    await api.addDependency(issueId, {
      dependsOnIssueId: current.issueId,
      type,
    });
  }
  await api.removeDependency(issueId, current.dependencyId);
}

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
      // Include both endpoints, their identifier aliases, and lists even after a partially completed conversion.
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
      run(() => changeRelationshipType(api, issueId, dependency, type)),
  };
}
