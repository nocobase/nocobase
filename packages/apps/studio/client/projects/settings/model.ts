/**
 * A project's Settings tab (`page.tsx`): its sections, which ones hold one repository at a time, and the URL that opens
 * one (`?section=ci&repo=<resourceId>`), kept in the query string so a link or a refresh lands on the same section.
 */
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';

import { repositoryFullName } from '../../../shared/releases.js';

export const SETTINGS_SECTIONS = [
  'general',
  'directories',
  'ci',
  'git',
  'variables',
  'skills',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

/** The sections shown: CI needs a repository, branch rules a Git connection as well. */
export function sectionsOf(
  resources: readonly Pick<ProjectResource, 'type'>[],
  gitEnabled: boolean,
): readonly SettingsSection[] {
  const repositories = resources.some(
    (resource) => resource.type === 'gitRepo',
  );
  return SETTINGS_SECTIONS.filter(
    (section) =>
      (section !== 'ci' || repositories) &&
      (section !== 'git' || (repositories && gitEnabled)),
  );
}

/** The sections that show one repository at a time, with a switcher when the project has more than one. */
export const REPOSITORY_SECTIONS: readonly SettingsSection[] = ['ci', 'git'];

export function isSettingsSection(value: unknown): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly unknown[]).includes(value);
}

/** The URL of a section of the project's settings, for one repository. */
export function projectSettingsPath(
  projectId: string,
  section: SettingsSection = 'general',
  resourceId?: string | null,
): string {
  const search = new URLSearchParams({ section });
  if (resourceId) search.set('repo', resourceId);
  return `/projects/${encodeURIComponent(projectId)}/settings?${search.toString()}`;
}

/** The working directory's name, as the project's list shows it: `owner/repo` for a repository. */
export function resourceName(resource: ProjectResource): string {
  if (resource.type === 'gitRepo')
    return (
      repositoryFullName({
        repo: resource.binding?.fullName ?? null,
        url: resource.url,
      }) || resource.id
    );
  return resource.label || resource.path || resource.id;
}

/** The anchor of a section card. */
export const sectionAnchor = (id: string): string => `project-settings-${id}`;
