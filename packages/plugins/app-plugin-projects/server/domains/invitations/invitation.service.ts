/**
 * Invitations from the member settings, on the user management plugin's invitations: it sends the links and creates
 * the accounts; this domain decides who may invite into which projects and adds invitees to them.
 *
 * - Whoever holds `invite` on `pm.members` invites into any projects (or none), and sees and manages every pending
 *   invitation; a project lead only into projects they lead, and at least one, and only their own invitations.
 * - An address that already has an account is added to the projects at once (`added`, or `alreadyMember` when there
 *   was nothing to join); nothing is sent.
 * - Every other address gets a link. The projects travel with the invitation as its data, so revoking or expiring it
 *   drops them too; accepting it (`accepted`) makes the new account a member and adds it to the projects that still
 *   exist, in the acceptance's transaction.
 */
import {
  UserManagementError,
  type UserInvitation,
  type UserInvitationAcceptedContext,
  type UserInvitationResult,
  type UserManagementService,
} from '@nocobase/app-plugin-users/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type {
  CreateInvitationsRequest,
  Invitation,
  InvitationResult,
} from '../../../shared/invitations.js';
import { canUseSetting, type Viewer } from '../../access/viewer.js';
import { unique } from '../../kernel/db.js';
import {
  DomainError,
  forbidden,
  invalid,
  notFound,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { MemberService } from '../members/index.js';
import {
  canManageProject,
  joinProject,
  projectNames,
  projectRelation,
} from '../projects/index.js';

/** The part of the user management plugin this domain uses. */
export type UserInvitations = Pick<
  UserManagementService,
  | 'invite'
  | 'listInvitations'
  | 'getInvitation'
  | 'resendInvitation'
  | 'revokeInvitation'
>;

/** Where this plugin's part of an invitation's data lives. */
export const INVITATION_DATA_KEY = '@nocobase/app-plugin-projects';

interface InvitationData {
  readonly projectIds: readonly string[];
}

export interface InvitationService {
  list(viewer: Viewer): Promise<Invitation[]>;
  create(
    viewer: Viewer,
    input: CreateInvitationsRequest,
    origin: string,
  ): Promise<InvitationResult[]>;
  resend(viewer: Viewer, id: string, origin: string): Promise<InvitationResult>;
  revoke(viewer: Viewer, id: string): Promise<void>;
  /** An invitation was accepted: registered with the user management plugin's `onInvitationAccepted`. */
  accepted(context: UserInvitationAcceptedContext): Promise<void>;
}

export interface InvitationDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly members: MemberService;
  readonly invitations: UserInvitations;
}

const managesInvitations = (viewer: Viewer) =>
  canUseSetting(viewer, 'pm.members', 'invite');

function dataOf(
  data: Readonly<Record<string, unknown>>,
): InvitationData | undefined {
  const value = data[INVITATION_DATA_KEY] as
    { readonly projectIds?: unknown } | undefined;
  if (!value || !Array.isArray(value.projectIds)) return undefined;
  return {
    projectIds: value.projectIds.filter(
      (id): id is string => typeof id === 'string',
    ),
  };
}

function validateProjectIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (
    !Array.isArray(value) ||
    value.some((id) => typeof id !== 'string' || !id)
  )
    throw invalid('INVALID_PROJECTS', 'projectIds must be an array of ids.');
  return unique(value as string[]);
}

/** A manager invites into any existing projects; anyone else into at least one, and must lead every one. */
async function checkInviter(
  conn: DatabaseConnection,
  viewer: Viewer,
  projectIds: readonly string[],
): Promise<void> {
  const manager = managesInvitations(viewer);
  if (!manager && projectIds.length === 0)
    throw forbidden(
      'Only someone who may invite members may invite without choosing a project.',
    );
  for (const projectId of projectIds) {
    const relation = await projectRelation(conn, viewer, projectId);
    if (!relation || (!manager && !relation.visible))
      throw invalid('INVALID_PROJECT', `Project ${projectId} does not exist.`);
    if (!manager && !canManageProject(viewer, relation))
      throw forbidden(
        'Only the project lead or someone who may invite members may invite into this project.',
      );
  }
}

/** The user management plugin's refusals, with their codes, as this plugin's errors. */
async function fromUsers<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (!(error instanceof UserManagementError)) throw error;
    const kind =
      error.status === 404
        ? 'notFound'
        : error.status === 409
          ? 'conflict'
          : 'invalid';
    throw new DomainError(kind, error.code, error.message, undefined, {
      domain: 'users',
    });
  }
}

/** A sent link as the member settings show it. */
function sentResult(result: UserInvitationResult): InvitationResult {
  return result.outcome === 'invited'
    ? {
        email: result.email,
        outcome: 'invited',
        emailSent: result.emailSent,
        ...(result.inviteUrl ? { inviteUrl: result.inviteUrl } : {}),
      }
    : { email: result.email, outcome: 'alreadyMember' };
}

export function createInvitationService(
  deps: InvitationDeps,
): InvitationService {
  /** An invitation of this plugin that the viewer may manage: a manager any, others only their own. */
  async function managed(viewer: Viewer, id: string): Promise<UserInvitation> {
    const invitation = await deps.invitations.getInvitation(id);
    if (
      !invitation ||
      !dataOf(invitation.data) ||
      (invitation.invitedBy.id !== viewer.userId && !managesInvitations(viewer))
    )
      throw notFound('Invitation');
    return invitation;
  }

  return {
    async list(viewer) {
      const rows = (
        await deps.invitations.listInvitations(
          managesInvitations(viewer) ? {} : { invitedBy: viewer.userId },
        )
      ).flatMap((row) => {
        const data = dataOf(row.data);
        return data ? [{ row, data }] : [];
      });
      const names = await projectNames(
        deps.tx.read(),
        unique(rows.flatMap(({ data }) => data.projectIds)),
      );
      return rows.map(({ row, data }) => ({
        id: row.id,
        email: row.email,
        status: row.status,
        projects: data.projectIds.flatMap((id) => {
          const name = names.get(id);
          return name === undefined ? [] : [{ id, name }];
        }),
        invitedBy: { userId: row.invitedBy.id, name: row.invitedBy.name },
        expiresAt: row.expiresAt,
        sentAt: row.sentAt,
        createdAt: row.createdAt,
      }));
    },

    async create(viewer, input, origin) {
      if (!Array.isArray(input.emails))
        throw invalid('INVALID_EMAILS', 'emails must be a list of addresses.');
      const projectIds = validateProjectIds(input.projectIds);
      const conn = deps.tx.read();
      await checkInviter(conn, viewer, projectIds);
      const names = await projectNames(conn, projectIds);
      const data: InvitationData = { projectIds };
      const results = await fromUsers(() =>
        deps.invitations.invite({
          emails: input.emails,
          invitedBy: viewer.userId,
          data: { [INVITATION_DATA_KEY]: data },
          summary: projectIds.flatMap((id) => names.get(id) ?? []),
          origin,
        }),
      );
      const joined = new Set<string>();
      await deps.tx.run(async (tx) => {
        for (const result of results) {
          if (result.outcome !== 'existingUser') continue;
          for (const projectId of projectIds)
            if (
              await joinProject(
                tx.conn,
                deps.ids.next(),
                projectId,
                result.userId,
              )
            )
              joined.add(result.email);
        }
      });
      return results.map((result) =>
        result.outcome === 'existingUser'
          ? {
              email: result.email,
              outcome: joined.has(result.email) ? 'added' : 'alreadyMember',
            }
          : sentResult(result),
      );
    },

    async resend(viewer, id, origin) {
      await managed(viewer, id);
      return sentResult(
        await fromUsers(() =>
          deps.invitations.resendInvitation(id, { origin }),
        ),
      );
    },

    async revoke(viewer, id) {
      await managed(viewer, id);
      await fromUsers(() => deps.invitations.revokeInvitation(id));
    },

    async accepted({ connection, userId, data }) {
      const invitation = dataOf(data);
      if (!invitation) return;
      await deps.members.admit(connection, userId);
      const names = await projectNames(connection, invitation.projectIds);
      for (const projectId of invitation.projectIds)
        if (names.has(projectId))
          await joinProject(connection, deps.ids.next(), projectId, userId);
    },
  };
}
