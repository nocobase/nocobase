import { ApiClientError } from '@nocobase/app-client';
import type {
  PermissionSet,
  PermissionSetWriteOperation,
} from '../authorization-client.js';
import type { Translate } from '../i18n.js';
import { errorMessage } from './feedback.js';

/**
 * What the management UI may offer for one Permission Set. Every answer comes
 * from the metadata the read endpoints report, so no key is hardcoded here.
 */
export interface PermissionSetCapabilities {
  /** Holding the set grants unrestricted access, so it has no grants to configure. */
  readonly unrestricted: boolean;
  /** The set is owned by code; `protection.allow` decides what is still offered. */
  readonly protectedSet: boolean;
  /** The editor may be opened, which is also what renames a set. */
  readonly canUpdate: boolean;
  readonly canDelete: boolean;
  readonly canAssign: boolean;
  readonly canRevoke: boolean;
  /** Subject types a new assignment may target; absent means any. */
  readonly assignableTo?: readonly string[];
}

/** An unsaved set has no server metadata yet and behaves as an ordinary one. */
export function permissionSetCapabilities(
  set?: PermissionSet,
): PermissionSetCapabilities {
  const unrestricted = set?.unrestricted === true;
  return {
    unrestricted,
    protectedSet: set?.protection !== undefined,
    // An unrestricted set has no grants to configure, so the editor is never useful.
    canUpdate: !unrestricted && allows(set, 'update'),
    canDelete: allows(set, 'delete'),
    canAssign: allows(set, 'assign'),
    canRevoke: allows(set, 'revoke'),
    ...(set?.protection?.assignableTo
      ? { assignableTo: set.protection.assignableTo }
      : {}),
  };
}

/** An existing assignment of a type no longer offered still displays; this is about what can be added. */
export function canAssignSubjectType(
  capabilities: PermissionSetCapabilities,
  subjectType: string,
): boolean {
  return (
    capabilities.canAssign &&
    (capabilities.assignableTo === undefined ||
      capabilities.assignableTo.includes(subjectType))
  );
}

function allows(
  set: PermissionSet | undefined,
  operation: PermissionSetWriteOperation,
): boolean {
  const protection = set?.protection;
  return protection === undefined || protection.allow.includes(operation);
}

/**
 * Turns an Authorization API failure into something a user can act on. The
 * server answers the protected and last-assignment cases with a reason the
 * panel knows, so the raw message never has to be read as one.
 */
export function permissionSetErrorMessage(
  t: Translate,
  error: unknown,
): string {
  switch (error instanceof ApiClientError ? error.reason : undefined) {
    case 'LAST_ASSIGNMENT':
      return t('errors.lastAssignment');
    case 'PROTECTED_PERMISSION_SET':
      return t('errors.protectedSet');
    case 'PERMISSION_SET_SUBJECT_NOT_ALLOWED':
      return t('errors.subjectNotAllowed');
    default:
      return errorMessage(t, error);
  }
}
