import type { AuthorizationContext } from '@nocobase/authorization/core';
import type {
  CreatePermissionSetInput,
  PermissionSet,
} from '@nocobase/authorization/permission-sets';
import type { DatabaseConnection } from '@nocobase/db';
import type { DatabasePermissionSetStore } from './stores/permission-sets.js';

type PermissionSetMutation =
  | {
      readonly operation: 'create';
      readonly previous: undefined;
      readonly next: Readonly<CreatePermissionSetInput>;
    }
  | {
      readonly operation: 'update';
      readonly previous: Readonly<PermissionSet>;
      readonly next: Readonly<CreatePermissionSetInput>;
    }
  | {
      readonly operation: 'delete';
      readonly previous: Readonly<PermissionSet>;
      readonly next: undefined;
    };

export type PermissionSetMutationContext = PermissionSetMutation & {
  /** Authorization for the caller of the generic API. */
  readonly authorization: AuthorizationContext;
  /** The transaction that commits the Permission Set mutation. Use it for policy reads. */
  readonly transaction: DatabaseConnection;
};

/** Reject a generic Permission Set write by throwing an API error. */
export type PermissionSetMutationCheck = (
  context: PermissionSetMutationContext,
) => void | Promise<void>;

export type PermissionSetMutationValidator = (
  change: PermissionSetMutation,
) => Promise<void>;

type PermissionSetMutationRunner<T> = (
  transaction?: DatabaseConnection,
  check?: PermissionSetMutationValidator,
  previous?: PermissionSet,
) => Promise<T>;

export class PermissionSetMutationChecks {
  private readonly checks = new Set<PermissionSetMutationCheck>();

  constructor(private readonly store: DatabasePermissionSetStore) {}

  readonly add = (check: PermissionSetMutationCheck): (() => void) => {
    this.checks.add(check);
    return () => {
      this.checks.delete(check);
    };
  };

  run<T>(
    transaction: DatabaseConnection | undefined,
    key: string | undefined,
    authorization: AuthorizationContext,
    save: PermissionSetMutationRunner<T>,
  ): Promise<T> {
    if (this.checks.size === 0) return save(transaction);
    const checks = [...this.checks];
    const execute = async (connection: DatabaseConnection): Promise<T> => {
      const previous =
        key === undefined
          ? undefined
          : await this.store.withTransaction(connection).getForMutation(key);
      return save(
        connection,
        async (change) => {
          for (const check of checks)
            await check({
              ...structuredClone(change),
              authorization,
              transaction: connection,
            });
        },
        previous,
      );
    };
    return transaction ? execute(transaction) : this.store.transaction(execute);
  }
}
