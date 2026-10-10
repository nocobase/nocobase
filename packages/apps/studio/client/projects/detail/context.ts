/**
 * What a project's page gives its tabs (`pages/projects/detail/*`), each a child route rendered in its outlet: the
 * project and its statuses, what the viewer may do there, and whether its repositories deploy anywhere.
 */
import type { StatusDefinition } from '@nocobase/app-plugin-projects/shared/issues';
import type { ProjectDetail } from '@nocobase/app-plugin-projects/shared/projects';
import { useOutletContext } from 'react-router';

import type { UnreleasedIssues } from '../../../shared/previews.js';

export interface ProjectPageContext {
  readonly project: ProjectDetail;
  readonly statuses: readonly StatusDefinition[] | undefined;
  /** The viewer may manage the project: its properties, members, working directories and settings. */
  readonly canEdit: boolean;
  /** Gates "New issue" and dragging cards on the Issues tab's board. */
  readonly canCreateIssues: boolean;
  /** The project's unreleased issues, with whether it deploys to production or builds previews; undefined while loading. */
  readonly releases: UnreleasedIssues | undefined;
}

export function useProjectPage(): ProjectPageContext {
  return useOutletContext<ProjectPageContext>();
}

/** Whether the project's repositories deploy to production or build previews: its Releases tab shows then. */
export function hasReleases(releases: UnreleasedIssues | undefined): boolean {
  return (
    releases !== undefined && (releases.hasProduction || releases.hasPreview)
  );
}
