import type { ProjectResource } from '../../../../shared/projects.js';

/** A repository URL: https, ssh (`ssh://`) or scp-style (`git@host:owner/repo`); catches typos only. */
export function isGitRepoUrl(value: string): boolean {
  const url = value.trim();
  return (
    /^https?:\/\/[^\s/]+\/\S+$/u.test(url) ||
    /^ssh:\/\/\S+$/u.test(url) ||
    /^[\w.-]+@[\w.-]+:\S+$/u.test(url)
  );
}

export function sortResources(
  resources: readonly ProjectResource[],
): ProjectResource[] {
  return [...resources].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  );
}

/**
 * Moving a repository up or down: positions become the list index after the move, and only the resources whose
 * position changes are returned, each one request.
 */
export function reorderResources(
  resources: readonly ProjectResource[],
  from: number,
  to: number,
): { readonly id: string; readonly position: number }[] {
  const moved = sortResources(resources);
  if (from < 0 || from >= moved.length || to < 0 || to >= moved.length)
    return [];
  const [item] = moved.splice(from, 1);
  if (item) moved.splice(to, 0, item);
  return moved.flatMap((resource, index) =>
    resource.position === index ? [] : [{ id: resource.id, position: index }],
  );
}
