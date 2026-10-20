import type {
  PermissionSet,
  PermissionSetAssignment,
  PermissionSetSubject,
} from './model.js';

export interface PermissionSetStore<TTransaction = unknown> {
  list(): Promise<readonly PermissionSet[]>;
  get(key: string): Promise<PermissionSet | undefined>;
  create(permissionSet: PermissionSet): Promise<PermissionSet>;
  update(
    key: string,
    permissionSet: PermissionSet,
    expectedRevision?: string,
  ): Promise<PermissionSet>;
  delete(key: string): Promise<void>;
  assign(assignment: PermissionSetAssignment): Promise<PermissionSetAssignment>;
  revoke(id: string): Promise<void>;
  listAssignments(
    permissionSet?: string,
  ): Promise<readonly PermissionSetAssignment[]>;
  findAssignments(
    subjects: readonly PermissionSetSubject[],
  ): Promise<readonly PermissionSetAssignment[]>;
  /** Serializes concurrent changes to one Permission Set; may do nothing. */
  lock?(key: string): Promise<void>;
  /** Runs an assignment mutation atomically; resolves only after commit. */
  transaction?<T>(run: (transaction: TTransaction) => Promise<T>): Promise<T>;
  /** A store bound to the caller's transaction; without transactions, itself. */
  withTransaction(transaction: TTransaction): PermissionSetStore<TTransaction>;
}
