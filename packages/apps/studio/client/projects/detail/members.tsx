/**
 * A project's Members tab: who belongs to the project and its visibility, drawn with the installed `project-detail`
 * block over the projects plugin's headless hooks. Everyone who sees the project sees them; whoever may manage the
 * project changes the visibility, makes a member the lead, adds members (searching the workspace's people who are not
 * members yet) and removes them after confirming. The lead is always a member, so the block offers no removal for
 * them until another lead is chosen.
 */
import {
  useProjectMembership,
  useWorkspaceMembers,
} from '@nocobase/app-plugin-projects/client/projects';
import type { ProjectVisibility } from '@nocobase/app-plugin-projects/shared/projects';
import type { ReactElement } from 'react';

import { ProjectMembersEditor } from '@/extensions/nocobase-project-detail/project-settings';

import { useProjectPage } from './context.js';
import { useProjectPageWording } from './labels.js';

export function ProjectMembers(): ReactElement {
  const { project, canEdit } = useProjectPage();
  const { detail: labels } = useProjectPageWording();
  const membership = useProjectMembership(project.id);
  const workspace = useWorkspaceMembers();
  const ignore = (): undefined => undefined;
  return (
    <div className='max-w-3xl'>
      <ProjectMembersEditor
        visibility={project.visibility}
        members={project.members.map((member) => ({
          id: member.id,
          name: member.name,
          lead: member.id === project.leadUserId,
        }))}
        candidates={(workspace.data ?? [])
          .filter(
            (member) =>
              !project.members.some((entry) => entry.id === member.userId),
          )
          .map((member) => ({ value: member.userId, label: member.name }))}
        busy={membership.isPending}
        labels={labels}
        {...(canEdit
          ? {
              onVisibilityChange: (visibility: ProjectVisibility) => {
                membership.setVisibility(visibility).catch(ignore);
              },
              onAdd: membership.add,
              onSetLead: membership.setLead,
              onRemove: membership.remove,
            }
          : {})}
      />
    </div>
  );
}
