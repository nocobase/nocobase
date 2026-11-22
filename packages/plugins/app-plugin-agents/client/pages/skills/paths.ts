/**
 * The skill library's own path wherever the application mounts it (`/skills`, `/settings/skills`): the parent of the
 * `new` and `:skillId` child pages, resolved from the current route rather than written out.
 */
import { useResolvedPath } from 'react-router';

export function useSkillsListPath(): string {
  return useResolvedPath('..', { relative: 'path' }).pathname;
}
