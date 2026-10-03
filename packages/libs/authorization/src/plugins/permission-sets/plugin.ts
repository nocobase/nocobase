import type {
  AuthorizationGrant,
  AuthorizationGrantService,
  AuthorizationGrantsChangedListener,
  PermissionGrant,
  ResolveAllAuthorizationGrantsInput,
  ResolveAuthorizationGrantsInput,
} from '../../core/grants.js';
import type { AuthorizationPlugin } from '../../core/plugin.js';
import {
  resolveAuthorizationSubjects,
  type AuthorizationSubjectRegistry,
} from '../../core/subjects.js';
import type { AuthorizationTitle } from '../../core/titles.js';
import type {
  AuthorizationIdentity,
  AuthorizationSubject,
  Principal,
} from '../../core/types.js';
import type {
  PermissionSet,
  PermissionSetAssignment,
  PermissionSetSubject,
} from './model.js';
import type { PermissionSetStore } from './store.js';
import { requireStore } from '../internal/store.js';

export interface CreatePermissionSetInput {
  key: string;
  title?: AuthorizationTitle;
  grants: readonly PermissionGrant[];
}

export interface AssignPermissionSetInput {
  id?: string;
  subject: PermissionSetSubject;
  permissionSet: string;
}

export interface ReplaceSubjectAssignmentsInput {
  subject: PermissionSetSubject;
  /** The Permission Sets this replacement owns; others are left alone. */
  managedPermissionSets: readonly string[];
  permissionSets: readonly string[];
}

export interface PermissionSetsApi<TTransaction = unknown> {
  create(input: CreatePermissionSetInput): Promise<PermissionSet>;
  update(key: string, input: CreatePermissionSetInput): Promise<PermissionSet>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<PermissionSet | undefined>;
  list(): Promise<readonly PermissionSet[]>;
  assign(input: AssignPermissionSetInput): Promise<PermissionSetAssignment>;
  /** Uses the store's transaction runner unless already bound with withTransaction. */
  revoke(id: string): Promise<void>;
  listAssignments(
    permissionSet?: string,
  ): Promise<readonly PermissionSetAssignment[]>;
  replaceSubjectAssignments(
    input: ReplaceSubjectAssignmentsInput,
  ): Promise<readonly PermissionSetAssignment[]>;
  /** Announces a change through `authz.onGrantsChanged`. */
  notifyAssignmentsChanged(subject: PermissionSetSubject): Promise<void>;
  /**
   * Throws when removing this subject would leave a Permission Set that
   * requires an active assignment without one. Bind this check and the actual
   * subject mutation to the same caller-owned transaction.
   */
  assertSubjectRemovable(subject: PermissionSetSubject): Promise<void>;
  /**
   * Returns an API bound to the caller's transaction. The caller owns the
   * transaction and publishes assignment changes after it commits, so the
   * bound API notifies no subscriber.
   */
  withTransaction(transaction: TTransaction): PermissionSetsApi<TTransaction>;
  /**
   * Marks Permission Sets as owned by code. The generic management surface
   * (the HTTP handler) refuses to change them; the owner's own code still can.
   * Returns a function that lifts the protection again.
   */
  protect(protection: PermissionSetProtection): () => void;
  protection(key: string): PermissionSetProtectionInfo | undefined;
  /** Throws PermissionSetProtectedError when the operation is not allowed on a protected Permission Set. */
  assertWritable(key: string, operation: PermissionSetWriteOperation): void;
  getEffective(input: {
    principal: Principal;
    subjects?: readonly AuthorizationSubject[];
  }): Promise<readonly PermissionSet[]>;
}

export type PermissionSetWriteOperation =
  'create' | 'update' | 'delete' | 'assign' | 'revoke';

/** Owner of a protection the library declares on its own behalf. */
export const PERMISSION_SETS_PROTECTION_OWNER: string =
  '@nocobase/authorization/permission-sets';

export interface PermissionSetProtection {
  /** Who registers the protection, usually a plugin package name. */
  owner: string;
  keys: readonly string[];
  /** Operations the generic management surface may still perform. */
  allow?: readonly PermissionSetWriteOperation[];
  /**
   * The set must always keep at least one assignment that can still act, so
   * an installation cannot revoke or disable its way out of the access the
   * set is the only source of. Independent of unrestricted access.
   */
  requireActiveAssignment?: boolean;
  /**
   * Holding the set grants unrestricted access: authorization is skipped
   * entirely, including Sharing and Restriction Rules. It is declared here
   * rather than on its own, so a set that confers it is always protected as
   * well: an unprotected superuser set should not exist.
   */
  unrestricted?: boolean;
  /** Subject types this set may be assigned to. Absent means any. */
  assignableTo?: readonly string[];
}

export interface PermissionSetProtectionInfo {
  owner: string;
  allow: readonly PermissionSetWriteOperation[];
  /** Present only when the set requires an active assignment. */
  requireActiveAssignment?: boolean;
  /** Present only when holding the set grants unrestricted access. */
  unrestricted?: boolean;
  /** Subject types this set may be assigned to. Absent means any. */
  assignableTo?: readonly string[];
}

export class PermissionSetProtectedError extends Error {
  readonly key: string;
  readonly owner: string;
  readonly operation: PermissionSetWriteOperation;

  constructor(
    key: string,
    owner: string,
    operation: PermissionSetWriteOperation,
  ) {
    super(
      `The ${key} Permission Set and its assignments are protected by ${owner}.`,
    );
    this.name = 'PermissionSetProtectedError';
    this.key = key;
    this.owner = owner;
    this.operation = operation;
  }
}

export class PermissionSetSubjectNotAllowedError extends Error {
  readonly key: string;
  readonly subjectType: string;

  constructor(key: string, subjectType: string) {
    super(
      `The ${key} Permission Set cannot be assigned to a ${subjectType} subject.`,
    );
    this.name = 'PermissionSetSubjectNotAllowedError';
    this.key = key;
    this.subjectType = subjectType;
  }
}

export class PermissionSetLastAssignmentError extends Error {
  readonly key: string;

  constructor(key: string) {
    super(
      `The last active assignment of the ${key} Permission Set cannot be removed.`,
    );
    this.name = 'PermissionSetLastAssignmentError';
    this.key = key;
  }
}

export interface PermissionSetRootSet {
  key: string;
  /** `false` lets the set stay empty between break-glass uses. */
  requireActiveAssignment?: boolean;
  /**
   * Subject types the set may be assigned to. The library declares no default:
   * which types are accounts rather than audiences is the host's convention.
   */
  assignableTo?: readonly string[];
}

export interface PermissionSetsOptions<TTransaction = unknown> {
  /** Where Permission Sets and their assignments are read and written. */
  store: PermissionSetStore<TTransaction>;
  /**
   * The Permission Set that confers unrestricted access. Declaring it here
   * protects it as the library's own: it may be assigned and revoked but not
   * edited or deleted, and it keeps an active assignment unless the
   * application says otherwise.
   */
  rootSet?: string | PermissionSetRootSet;
  /**
   * The Permission Set an installation keeps as its ordinary one: its grants
   * stay editable, while the set itself and its assignments do not.
   *
   * This names a set and its protection. It does not mean "these grants apply
   * to every identity without an assignment": that meaning lives in the
   * assignment row binding the set to an audience subject, and in the host
   * middleware that adds that subject to a request. It must stay there,
   * because the library's "every identity" would include the anonymous ones
   * in a host that has them.
   */
  defaultSet?: string;
}

export class PermissionSetNotFoundError extends Error {
  constructor(key: string) {
    super(`Unknown Permission Set: ${key}`);
    this.name = 'PermissionSetNotFoundError';
  }
}

export class PermissionSetConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionSetConflictError';
  }
}

export interface PermissionSetsAuthorizationApi<TTransaction = unknown> {
  permissionSets: PermissionSetsApi<TTransaction>;
}

export type PermissionSetsPlugin<TTransaction = unknown> = AuthorizationPlugin<
  PermissionSetsAuthorizationApi<TTransaction>
>;

export function permissionSetsPlugin<TTransaction = unknown>(
  options: PermissionSetsOptions<TTransaction>,
): PermissionSetsPlugin<TTransaction> {
  const service = new PermissionSetService(
    requireStore(options.store, 'Permission Sets'),
  );
  const rootSet = resolveRootSet(options.rootSet);
  if (rootSet) {
    service.protect({
      owner: PERMISSION_SETS_PROTECTION_OWNER,
      keys: [rootSet.key],
      allow: ['assign', 'revoke'],
      requireActiveAssignment: rootSet.requireActiveAssignment ?? true,
      unrestricted: true,
      ...(rootSet.assignableTo ? { assignableTo: rootSet.assignableTo } : {}),
    });
  }
  if (options.defaultSet) {
    service.protect({
      owner: PERMISSION_SETS_PROTECTION_OWNER,
      keys: [options.defaultSet],
      allow: ['update'],
    });
  }
  return {
    id: 'permission-sets',
    grants: service.grantService(),
    authorizationApi: { permissionSets: service },
    setup(authz): void {
      service.useSubjects(authz.subjects);
    },
  };
}

/** What every service derived from one plugin instance shares. */
interface PermissionSetSharedState {
  readonly protections: Map<string, PermissionSetProtectionInfo>;
  readonly subscribers: Set<AuthorizationGrantsChangedListener>;
  subjects?: AuthorizationSubjectRegistry;
}

function resolveRootSet(
  rootSet: string | PermissionSetRootSet | undefined,
): PermissionSetRootSet | undefined {
  if (rootSet === undefined) return undefined;
  return typeof rootSet === 'string' ? { key: rootSet } : rootSet;
}

class PermissionSetService<
  TTransaction = unknown,
> implements PermissionSetsApi<TTransaction> {
  private readonly protections: Map<string, PermissionSetProtectionInfo>;

  constructor(
    private readonly store: PermissionSetStore<TTransaction>,
    private readonly shared: PermissionSetSharedState = {
      protections: new Map(),
      subscribers: new Set(),
    },
    private readonly transaction?: TTransaction,
  ) {
    this.protections = shared.protections;
  }

  /** The registry that answers which subjects can still act. */
  useSubjects(subjects: AuthorizationSubjectRegistry): void {
    this.shared.subjects = subjects;
  }

  /** The Grant Provider side, kept off the public API. */
  grantService(): AuthorizationGrantService {
    return {
      resolve: (input) => this.resolveGrants(input),
      resolveAll: (input) => this.resolveAllGrants(input),
      for: (identity) => this.grantsFor(identity),
      unrestricted: async (identity) =>
        this.hasUnrestrictedSets() &&
        this.setsAreUnrestricted(await this.getEffective(identity)),
      onChange: (listener) => this.onChange(listener),
    };
  }

  protect(protection: PermissionSetProtection): () => void {
    const allow = [...new Set(protection.allow ?? [])];
    const registered: string[] = [];
    for (const key of protection.keys) {
      const existing = this.protections.get(key);
      if (existing && existing.owner !== protection.owner) {
        throw new Error(
          `Permission Set "${key}" is already protected by ${existing.owner}`,
        );
      }
      this.protections.set(key, {
        owner: protection.owner,
        allow,
        ...(protection.requireActiveAssignment
          ? { requireActiveAssignment: true }
          : {}),
        ...(protection.unrestricted ? { unrestricted: true } : {}),
        ...(protection.assignableTo
          ? { assignableTo: [...protection.assignableTo] }
          : {}),
      });
      registered.push(key);
    }
    return (): void => {
      for (const key of registered) {
        if (this.protections.get(key)?.owner === protection.owner) {
          this.protections.delete(key);
        }
      }
    };
  }

  protection(key: string): PermissionSetProtectionInfo | undefined {
    return this.protections.get(key);
  }

  assertWritable(key: string, operation: PermissionSetWriteOperation): void {
    const protection = this.protections.get(key);
    if (!protection || protection.allow.includes(operation)) return;
    throw new PermissionSetProtectedError(key, protection.owner, operation);
  }

  private async resolveGrants(
    input: ResolveAuthorizationGrantsInput,
  ): Promise<readonly AuthorizationGrant[]> {
    const grants = await this.resolveAllGrants({
      principal: input.principal,
      subjects: input.subjects,
    });
    return grants
      .filter(
        (grant) =>
          this.resourceMatches(grant.resource, input.resource) &&
          grant.action === input.action,
      )
      .map((grant) => ({ ...grant, resource: input.resource }));
  }

  private async resolveAllGrants(
    input: ResolveAllAuthorizationGrantsInput,
  ): Promise<readonly AuthorizationGrant[]> {
    return this.toGrants(await this.getEffective(input));
  }

  private grantsFor(
    identity: AuthorizationIdentity,
  ): AuthorizationGrantService {
    // One store read per request: every derived answer comes from this promise.
    let sets: Promise<readonly PermissionSet[]> | undefined;
    const effective = (): Promise<readonly PermissionSet[]> => {
      sets ??= this.getEffective(identity);
      return sets;
    };
    let grants: Promise<readonly AuthorizationGrant[]> | undefined;
    const resolveAll = (): Promise<readonly AuthorizationGrant[]> => {
      grants ??= effective().then((resolved) => this.toGrants(resolved));
      return grants;
    };
    return {
      resolve: async (input) =>
        (await resolveAll())
          .filter(
            (grant) =>
              this.resourceMatches(grant.resource, input.resource) &&
              grant.action === input.action,
          )
          .map((grant) => ({ ...grant, resource: input.resource })),
      resolveAll,
      unrestricted: async () =>
        this.hasUnrestrictedSets() &&
        this.setsAreUnrestricted(await effective()),
    };
  }

  private hasUnrestrictedSets(): boolean {
    for (const protection of this.protections.values()) {
      if (protection.unrestricted) return true;
    }
    return false;
  }

  private setsAreUnrestricted(sets: readonly PermissionSet[]): boolean {
    return sets.some((set) => this.protections.get(set.key)?.unrestricted);
  }

  private toGrants(
    sets: readonly PermissionSet[],
  ): readonly AuthorizationGrant[] {
    return sets.flatMap((set) =>
      set.grants.flatMap((grant) =>
        grant.actions.map((action): AuthorizationGrant => ({
          source: {
            plugin: 'permission-sets',
            id: set.key,
            ...(set.title === undefined ? {} : { title: set.title }),
          },
          resource: grant.resource,
          action: action.action,
          ...(action.policy === undefined ? {} : { policy: action.policy }),
        })),
      ),
    );
  }

  getEffective(input: {
    principal: Principal;
    subjects?: readonly AuthorizationSubject[];
  }): Promise<readonly PermissionSet[]> {
    return this.resolvePermissionSets(input);
  }

  async create(input: CreatePermissionSetInput): Promise<PermissionSet> {
    if (await this.store.get(input.key)) {
      throw new PermissionSetConflictError(
        `Permission Set already exists: ${input.key}`,
      );
    }
    return this.store.create(this.toPermissionSet(input));
  }

  async update(
    key: string,
    input: CreatePermissionSetInput,
  ): Promise<PermissionSet> {
    if (!(await this.store.get(key))) {
      throw new PermissionSetNotFoundError(key);
    }
    if (key !== input.key && (await this.store.get(input.key))) {
      throw new PermissionSetConflictError(
        `Permission Set already exists: ${input.key}`,
      );
    }
    const affectedSubjects = await this.assignedSubjects(key);
    const permissionSet = await this.store.update(
      key,
      this.toPermissionSet(input),
    );
    await this.notifySubjectsChanged(affectedSubjects);
    return permissionSet;
  }

  async delete(key: string): Promise<void> {
    if (!(await this.store.get(key))) {
      throw new PermissionSetNotFoundError(key);
    }
    const affectedSubjects = await this.assignedSubjects(key);
    await this.store.delete(key);
    await this.notifySubjectsChanged(affectedSubjects);
  }

  get(key: string): Promise<PermissionSet | undefined> {
    return this.store.get(key);
  }

  list(): Promise<readonly PermissionSet[]> {
    return this.store.list();
  }

  async assign(
    input: AssignPermissionSetInput,
  ): Promise<PermissionSetAssignment> {
    if (!(await this.store.get(input.permissionSet))) {
      throw new PermissionSetNotFoundError(input.permissionSet);
    }
    this.assertAssignableTo(input.permissionSet, input.subject);
    const assignment = await this.store.assign({
      id: input.id ?? this.createAssignmentId(input),
      subject: input.subject,
      permissionSet: input.permissionSet,
    });
    await this.notifyAssignmentsChanged(input.subject);
    return assignment;
  }

  async revoke(id: string): Promise<void> {
    const assignment = await this.mutateAssignments((service) =>
      service.revokeAssignment(id),
    );
    if (assignment) await this.notifyAssignmentsChanged(assignment.subject);
  }

  private async revokeAssignment(
    id: string,
  ): Promise<PermissionSetAssignment | undefined> {
    await this.lockProtectedSets();
    const assignment = (await this.store.listAssignments()).find(
      (item) => item.id === id,
    );
    if (assignment) await this.assertRetainsAssignment(assignment);
    await this.store.revoke(id);
    return assignment;
  }

  listAssignments(
    permissionSet?: string,
  ): Promise<readonly PermissionSetAssignment[]> {
    return this.store.listAssignments(permissionSet);
  }

  async replaceSubjectAssignments(
    input: ReplaceSubjectAssignmentsInput,
  ): Promise<readonly PermissionSetAssignment[]> {
    const result = await this.mutateAssignments((service) =>
      service.replaceAssignments(input),
    );
    if (result.changed) await this.notifyAssignmentsChanged(input.subject);
    return result.assignments;
  }

  private async replaceAssignments(
    input: ReplaceSubjectAssignmentsInput,
  ): Promise<{
    assignments: readonly PermissionSetAssignment[];
    changed: boolean;
  }> {
    await this.lockProtectedSets();
    const managed = new Set(input.managedPermissionSets);
    const requested = [...new Set(input.permissionSets)];
    if (requested.some((key) => !managed.has(key))) {
      throw new TypeError(
        'Replacement Permission Sets must belong to the managed scope',
      );
    }
    for (const key of requested) {
      if (!(await this.store.get(key))) {
        throw new PermissionSetNotFoundError(key);
      }
      this.assertAssignableTo(key, input.subject);
    }
    const existing = (await this.store.listAssignments()).filter(
      (assignment) =>
        assignment.subject.type === input.subject.type &&
        assignment.subject.id === input.subject.id &&
        managed.has(assignment.permissionSet),
    );
    const requestedSet = new Set(requested);
    const removed = existing.filter(
      (assignment) => !requestedSet.has(assignment.permissionSet),
    );
    // Refuse the whole replacement before it writes anything.
    for (const assignment of removed) {
      await this.assertRetainsAssignment(assignment);
    }
    for (const assignment of removed) {
      await this.store.revoke(assignment.id);
    }
    const existingKeys = new Set(
      existing.map((assignment) => assignment.permissionSet),
    );
    const created: PermissionSetAssignment[] = [];
    for (const permissionSet of requested) {
      if (existingKeys.has(permissionSet)) continue;
      const assignment: PermissionSetAssignment = {
        id: this.createAssignmentId({
          subject: input.subject,
          permissionSet,
        }),
        subject: input.subject,
        permissionSet,
      };
      created.push(await this.store.assign(assignment));
    }
    const kept = existing.filter((assignment) =>
      requestedSet.has(assignment.permissionSet),
    );
    return {
      assignments: [...kept, ...created],
      changed: created.length > 0 || removed.length > 0,
    };
  }

  private mutateAssignments<T>(
    run: (service: PermissionSetService<TTransaction>) => Promise<T>,
  ): Promise<T> {
    if (this.transaction !== undefined || !this.store.transaction)
      return run(this);
    return this.store.transaction((transaction) =>
      run(
        new PermissionSetService(
          this.store.withTransaction(transaction),
          this.shared,
          transaction,
        ),
      ),
    );
  }

  private async lockProtectedSets(): Promise<void> {
    // Lock before the first assignment read, including under repeatable-read
    // isolation. All removal paths acquire multiple guards in the same order.
    const keys = [...this.protections]
      .filter(([, protection]) => protection.requireActiveAssignment)
      .map(([key]) => key)
      .sort();
    for (const key of keys) await this.store.lock?.(key);
  }

  private onChange(listener: AuthorizationGrantsChangedListener): () => void {
    this.shared.subscribers.add(listener);
    return (): void => {
      this.shared.subscribers.delete(listener);
    };
  }

  async notifyAssignmentsChanged(subject: PermissionSetSubject): Promise<void> {
    if (this.transaction === undefined) {
      await this.publishAssignmentsChanged(subject);
      return;
    }
    // Bound to a transaction, a change is only real once it commits. A
    // @nocobase/db connection runs the publication after its commit and drops
    // it on rollback; any other transaction leaves publishing to its owner.
    afterCommitHook(this.transaction)?.(() =>
      this.publishAssignmentsChanged(subject),
    );
  }

  private async publishAssignmentsChanged(
    subject: PermissionSetSubject,
  ): Promise<void> {
    for (const listener of this.shared.subscribers) await listener(subject);
  }

  withTransaction(transaction: TTransaction): PermissionSetsApi<TTransaction> {
    return new PermissionSetService<TTransaction>(
      this.store.withTransaction(transaction),
      this.shared,
      transaction,
    );
  }

  async assertSubjectRemovable(subject: PermissionSetSubject): Promise<void> {
    await this.lockProtectedSets();
    const assignments = await this.store.listAssignments();
    for (const assignment of assignments) {
      if (
        assignment.subject.type === subject.type &&
        assignment.subject.id === subject.id
      ) {
        await this.assertRetainsAssignment(assignment);
      }
    }
  }

  /**
   * Enforced here rather than in the handler alone, so an application that
   * assigns through the api is held to the same restriction.
   */
  private assertAssignableTo(key: string, subject: PermissionSetSubject): void {
    const assignableTo = this.protections.get(key)?.assignableTo;
    if (!assignableTo || assignableTo.includes(subject.type)) return;
    throw new PermissionSetSubjectNotAllowedError(key, subject.type);
  }

  /**
   * A Permission Set that requires an active assignment is the only source of
   * the access it grants, so removing its last one would leave nobody able to
   * restore it.
   */
  private async assertRetainsAssignment(
    removing: PermissionSetAssignment,
  ): Promise<void> {
    const key = removing.permissionSet;
    if (!this.protections.get(key)?.requireActiveAssignment) return;
    const remaining = (await this.store.listAssignments(key)).filter(
      (assignment) => assignment.id !== removing.id,
    );
    const active = await this.activeSubjects(
      remaining.map((assignment) => assignment.subject),
    );
    if (active.length === 0) {
      throw new PermissionSetLastAssignmentError(key);
    }
  }

  /** Every subject counts until a declared subject type says otherwise. */
  private async activeSubjects(
    subjects: readonly PermissionSetSubject[],
  ): Promise<readonly PermissionSetSubject[]> {
    return (
      (await this.shared.subjects?.filterActive(subjects, this.transaction)) ??
      subjects
    );
  }

  private async assignedSubjects(
    permissionSet: string,
  ): Promise<readonly PermissionSetSubject[]> {
    const assignments = await this.store.listAssignments(permissionSet);
    const subjects = new Map<string, PermissionSetSubject>();
    for (const assignment of assignments) {
      subjects.set(
        `${assignment.subject.type}\u0000${assignment.subject.id}`,
        assignment.subject,
      );
    }
    return [...subjects.values()];
  }

  private async notifySubjectsChanged(
    subjects: readonly PermissionSetSubject[],
  ): Promise<void> {
    for (const subject of subjects) {
      await this.notifyAssignmentsChanged(subject);
    }
  }

  private toPermissionSet(input: CreatePermissionSetInput): PermissionSet {
    return {
      key: input.key,
      ...(input.title === undefined ? {} : { title: input.title }),
      grants: [...input.grants],
    };
  }

  private async resolvePermissionSets(input: {
    principal: Principal;
    subjects?: readonly AuthorizationSubject[];
  }): Promise<readonly PermissionSet[]> {
    const subjects = resolveAuthorizationSubjects(input);
    const assignments = await this.store.findAssignments(subjects);
    const keys = new Set(
      assignments.map((assignment) => assignment.permissionSet),
    );
    const requested = [...keys];
    const sets = await Promise.all(requested.map((key) => this.store.get(key)));
    const missing = sets.findIndex((set) => set === undefined);
    if (missing >= 0) {
      throw new Error(`Unknown Permission Set: ${requested[missing]}`);
    }
    return sets as PermissionSet[];
  }

  private resourceMatches(
    configured: PermissionGrant['resource'],
    requested: PermissionGrant['resource'],
  ): boolean {
    return (
      configured.type === requested.type &&
      (configured.id === '*' || configured.id === requested.id)
    );
  }

  private createAssignmentId(input: AssignPermissionSetInput): string {
    return `${input.subject.type}:${input.subject.id}:${input.permissionSet}`;
  }
}

/**
 * The `afterCommit` of a transaction that offers one, as a @nocobase/db
 * connection does. The store's transaction type is opaque here, so the
 * capability is detected rather than required.
 */
function afterCommitHook(
  transaction: unknown,
): ((callback: () => Promise<void>) => void) | undefined {
  if (typeof transaction !== 'object' || transaction === null) return undefined;
  const afterCommit: unknown = Reflect.get(transaction, 'afterCommit');
  if (typeof afterCommit !== 'function') return undefined;
  return (callback) => {
    Reflect.apply(afterCommit, transaction, [callback]);
  };
}
