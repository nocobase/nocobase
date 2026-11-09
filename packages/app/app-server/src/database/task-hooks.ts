import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface DatabaseTaskHookContext {
  /** Managed connections actually reset by this execution, in reset order. */
  readonly resetConnections: readonly string[];
}

export interface DatabaseTaskHook {
  /** Unique within the application. */
  readonly name: string;
  beforeTasks(context: DatabaseTaskHookContext): Promise<void>;
}

export interface DatabaseTaskHooks {
  /** Register synchronously from a Provider's register(), without relying on boot(). */
  add(hook: DatabaseTaskHook): void;
  registrations(): readonly DatabaseTaskHook[];
}

export const databaseTaskHooksToken: ServiceToken<DatabaseTaskHooks> =
  createServiceToken<DatabaseTaskHooks>(
    '@nocobase/app-server/database/task-hooks',
  );

/** Owned by DatabaseProvider; task execution borrows registrations and never disposes their resources. */
export function createDatabaseTaskHooks(): DatabaseTaskHooks {
  const hooks = new Map<string, DatabaseTaskHook>();
  return {
    add(hook) {
      if (hooks.has(hook.name))
        throw new Error(
          `Database task hook "${hook.name}" is already registered.`,
        );
      hooks.set(hook.name, hook);
    },
    registrations: () => [...hooks.values()],
  };
}
