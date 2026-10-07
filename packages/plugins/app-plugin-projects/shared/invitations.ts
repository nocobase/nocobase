/**
 * Invitations from the member settings. The user management plugin sends them and creates the accounts; this plugin
 * decides who may invite into which projects, and adds invitees to those projects when they accept.
 */

/** `expired` is derived from `expiresAt`. */
export type InvitationStatus = 'pending' | 'expired' | 'accepted' | 'revoked';

/** A row of `GET /api/projects/invitations`: pending and expired ones. */
export interface Invitation {
  readonly id: string;
  readonly email: string;
  readonly status: InvitationStatus;
  /** The projects the invitee joins; ones deleted since are left out. */
  readonly projects: readonly { readonly id: string; readonly name: string }[];
  readonly invitedBy: { readonly userId: string; readonly name: string };
  readonly expiresAt: string;
  /** The last successful send; null when sending failed. */
  readonly sentAt: string | null;
  readonly createdAt: string;
}

/**
 * `POST /api/projects/invitations`: several addresses at once, joining the projects as members. Answers 201
 * `{ data: { results: InvitationResult[] } }`, one per address.
 */
export interface CreateInvitationsRequest {
  readonly emails: readonly string[];
  readonly projectIds?: readonly string[];
}

/**
 * - `invited`: a link was sent;
 * - `added`: the address already has an account, which was added to the projects;
 * - `alreadyMember`: it already has an account and there was nothing to join.
 */
export type InvitationOutcome = 'invited' | 'added' | 'alreadyMember';

export interface InvitationResult {
  readonly email: string;
  readonly outcome: InvitationOutcome;
  /** On `invited`: whether the email went out. */
  readonly emailSent?: boolean;
  /** When sending failed, the link, once, for the inviter to forward; the list never shows it. */
  readonly inviteUrl?: string;
}
