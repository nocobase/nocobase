/** The members of a project. The lead is always a member, so the lead cannot be removed. */
import type { UserRef } from '../../../shared/common.js';
import type { AddProjectMemberRequest } from '../../../shared/projects.js';
import type { Viewer } from '../../access/viewer.js';
import { conflict, invalid } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { UserDirectory } from '../../kernel/users.js';
import { managed } from './project.access.js';
import { addMember, listMembers, removeMember } from './project.store.js';

export interface ProjectMembers {
  addMember(
    viewer: Viewer,
    projectId: string,
    input: AddProjectMemberRequest,
  ): Promise<UserRef[]>;
  removeMember(
    viewer: Viewer,
    projectId: string,
    userId: string,
  ): Promise<UserRef[]>;
}

export function createProjectMembers(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly users: UserDirectory;
}): ProjectMembers {
  return {
    addMember: (viewer, projectId, input) =>
      managed(deps.tx, viewer, projectId, async (tx) => {
        if (
          typeof input.userId !== 'string' ||
          !(await deps.users.isPerson(tx.conn, input.userId))
        )
          throw invalid('INVALID_USER', 'userId is not an active user.');
        await addMember(tx.conn, deps.ids.next(), projectId, input.userId);
        return listMembers(tx.conn, projectId);
      }),

    removeMember: (viewer, projectId, userId) =>
      managed(deps.tx, viewer, projectId, async (tx, { project }) => {
        if (project.leadUserId === userId)
          throw conflict(
            'LEAD_MEMBER',
            'Choose another project lead before removing this member.',
          );
        await removeMember(tx.conn, projectId, userId);
        return listMembers(tx.conn, projectId);
      }),
  };
}
