/** What a project still has to set up (`next-steps.tsx`), from what is known of it. */
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';

import type { CiConnectionState } from '../../../shared/ci-modes.js';
import type { ProjectInitView } from '../../../shared/project-init.js';
import { projectSettingsPath, resourceName } from '../settings/model.js';

/** One thing still to do. */
export interface NextStep {
  readonly key: string;
  readonly title: string;
  /** Where it stands, when that says more than the title. */
  readonly state: string | null;
  readonly to: string;
}

/** The steps a project still has, from what is known of it; repositories whose CI is unknown yet are left out. */
export function nextSteps(
  input: {
    readonly projectId: string;
    readonly resources: readonly ProjectResource[];
    readonly init: ProjectInitView | null | undefined;
    /** Each repository's preview CI, by working directory; missing while it loads. */
    readonly ci: Readonly<Record<string, CiConnectionState | undefined>>;
  },
  t: (key: string, values?: Record<string, unknown>) => string,
): NextStep[] {
  const steps: NextStep[] = [];
  if (input.resources.length === 0)
    steps.push({
      key: 'directory',
      title: t('projectPage.nextSteps.addDirectory'),
      state: null,
      to: projectSettingsPath(input.projectId, 'directories'),
    });
  if (input.init && input.init.state !== 'done' && input.init.issueId)
    steps.push({
      key: 'init',
      title: t('projectPage.nextSteps.init'),
      state: t(`projectPage.init.states.${input.init.state}`),
      to: `/issues/${encodeURIComponent(input.init.issueId)}`,
    });
  for (const resource of input.resources) {
    if (resource.type !== 'gitRepo') continue;
    const state = input.ci[resource.id];
    if (state === undefined || state === 'connected') continue;
    steps.push({
      key: `ci:${resource.id}`,
      title: t('projectPage.nextSteps.ci', { name: resourceName(resource) }),
      state: state === 'none' ? null : t(`ciSetup.states.${state}`),
      to: projectSettingsPath(input.projectId, 'ci', resource.id),
    });
  }
  return steps;
}
