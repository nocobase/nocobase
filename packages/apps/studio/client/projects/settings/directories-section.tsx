/**
 * Settings › Working directories: the project's working directories in order, drawn with the installed
 * `project-detail` block, each with "Edit" (`directory-dialog.tsx`, opened by `?edit=<id>` so a link or a refresh
 * reopens it), moving and removing; and "Add working directory" (`../detail/resource-dialog.tsx`), after which a
 * repository's "Deployment" opens, where its preview CI is connected.
 */
import { useRunnerOptions } from '@nocobase/app-plugin-agents/client/kit';
import {
  useProjectResources,
  useResourceValidation,
} from '@nocobase/app-plugin-projects/client/projects';
import type {
  ProjectDetail,
  ProjectResource,
} from '@nocobase/app-plugin-projects/shared/projects';
import { useState, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { ProjectResourceList } from '@/extensions/nocobase-project-detail/project-settings';

import { useGitStatus } from '../../git/api.js';
import { useProjectPageWording } from '../detail/labels.js';
import { AddWorkingDirectoryDialog } from '../detail/resource-dialog.js';
import { DirectoryDialog } from './directory-dialog.js';
import { projectSettingsPath, resourceName } from './model.js';

export function DirectoriesSection({
  project,
  canEdit,
}: {
  readonly project: ProjectDetail;
  readonly canEdit: boolean;
}): ReactElement {
  const { t: pm, detail: labels } = useProjectPageWording();
  const runners = useRunnerOptions();
  const resources = useProjectResources(project.id, project.resources);
  const validate = useResourceValidation();
  const git = useGitStatus().data;
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const ignore = (): undefined => undefined;
  const editing =
    resources.sorted.find((resource) => resource.id === search.get('edit')) ??
    null;
  const withEdit = (id: string | null) => {
    const next = new URLSearchParams(search);
    if (id) next.set('edit', id);
    else next.delete('edit');
    return next;
  };

  const detailOf = (resource: ProjectResource): string => {
    if (resource.type === 'directory') {
      const runner =
        runners.options.find((option) => option.value === resource.runnerId)
          ?.label ??
        resource.runnerId ??
        '';
      return [resource.label ? resource.path : null, runner]
        .filter(Boolean)
        .join(' · ');
    }
    return resource.defaultRef ?? pm('resources.defaultBranch');
  };

  return (
    <>
      <ProjectResourceList
        resources={resources.sorted.map((resource) => ({
          id: resource.id,
          type: resource.type,
          name: resourceName(resource),
          detail: detailOf(resource),
        }))}
        busy={resources.isPending}
        labels={labels}
        {...(canEdit
          ? {
              hrefOf: (id: string) => ({
                search: `?${withEdit(id).toString()}`,
              }),
              onAdd: () => setAdding(true),
              onMove: (from: number, to: number) => {
                resources.move(from, to).catch(ignore);
              },
              onRemove: (id: string) => {
                resources.remove(id).catch(ignore);
              },
            }
          : {})}
      />
      <DirectoryDialog
        resource={canEdit ? editing : null}
        onClose={() => setSearch(withEdit(null), { replace: true })}
        runners={runners}
        connections={git?.enabled ? git.connections : []}
        validate={validate}
        onSubmit={resources.save}
        labels={labels}
      />
      <AddWorkingDirectoryDialog
        projectId={project.id}
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={(resourceId, repository) => {
          setAdding(false);
          if (resourceId && repository)
            void navigate(projectSettingsPath(project.id, 'ci', resourceId));
        }}
      />
    </>
  );
}
