import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface DatabaseTaskHookContext {
  /** Connections this plan has already reset, in reset order; empty for ordinary runs. */
  readonly resetConnections: readonly string[];
}

export interface DatabaseTaskHook {
  /** Unique within one application's registry. */
  readonly name: string;
  beforeTasks(context: DatabaseTaskHookContext): Promise<void>;
}

/** Registration is synchronous and performs no preparation or I/O. */
export class DatabaseTaskHooks {
  private readonly hooks: Map<string, DatabaseTaskHook> = new Map();

  public register(hook: DatabaseTaskHook): void {
    if (!hook.name.trim())
      throw new Error('Database task hook name must not be empty.');
    if (this.hooks.has(hook.name)) {
      throw new Error(
        `Database task hook "${hook.name}" is already registered.`,
      );
    }
    this.hooks.set(
      hook.name,
      Object.freeze({
        name: hook.name,
        beforeTasks: hook.beforeTasks.bind(hook),
      }),
    );
  }

  /** A running plan keeps its registrations even when later hooks are registered. */
  public snapshot(): readonly DatabaseTaskHook[] {
    return Object.freeze([...this.hooks.values()]);
  }
}

export const databaseTaskHooksToken: ServiceToken<DatabaseTaskHooks> =
  createServiceToken<DatabaseTaskHooks>('database.taskHooks');
