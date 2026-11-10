import { ApiError } from '@nocobase/app-server/router';
import type {
  AppDatabaseTaskCoordinatorContext,
  AppDatabaseTasksResult,
} from '@nocobase/app-server/database';
import type { DatabaseConnection } from '@nocobase/db';
import type {
  ModuleDefinition,
  ModuleManagement,
  ModulesService,
} from '../tokens.js';

export class DefaultModulesService implements ModulesService {
  private readonly registered = new Map<string, ModuleDefinition>();
  private management?: ModuleManagement;
  private readonly active = new Map<string, (() => Promise<void> | void)[]>();
  private context?: AppDatabaseTaskCoordinatorContext;
  private result?: AppDatabaseTasksResult;
  private started = false;
  constructor(
    private readonly requiresDatabase: (packageName: string) => boolean = () =>
      false,
  ) {}
  get definitions(): ReadonlyMap<string, ModuleDefinition> {
    return this.registered;
  }
  register(definition: ModuleDefinition): void {
    if (this.started)
      throw new Error('Register modules before application readiness.');
    if (
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(definition.id) ||
      definition.id.length > 40
    )
      throw new Error(`Invalid module id: ${definition.id}`);
    if (
      !(
        definition.entry === `/modules/${definition.id}` ||
        definition.entry.startsWith(`/modules/${definition.id}/`)
      ) ||
      !/^\/modules\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(definition.entry)
    )
      throw new Error(`Invalid module entry: ${definition.entry}`);
    if (this.registered.has(definition.id))
      throw new Error(`Duplicate module: ${definition.id}`);
    this.registered.set(definition.id, Object.freeze({ ...definition }));
  }
  definition(id: string): ModuleDefinition {
    const definition = this.registered.get(id);
    if (!definition) throw new Error(`Unknown module: ${id}`);
    return definition;
  }
  setManagement(management: ModuleManagement): void {
    if (this.started || this.management)
      throw new Error(
        'Module management must be selected once before readiness.',
      );
    this.management = management;
  }
  async coordinate(
    context: AppDatabaseTaskCoordinatorContext,
  ): Promise<AppDatabaseTasksResult> {
    if (this.management) return this.management.coordinate(context);
    const result = await context.execute();
    if (
      !context.options.dryRun &&
      (!context.options.operation || context.options.operation === 'run')
    ) {
      this.context = context;
      this.result = result;
    }
    return result;
  }
  async requireAvailable(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<void> {
    this.definition(id);
    if (this.management)
      return this.management.requireAvailable(id, connection);
    if (!this.active.has(id))
      throw new ApiError({
        status: 'UNAVAILABLE',
        domain: 'modules',
        reason: 'MODULE_NOT_READY',
        message: 'Module is not ready.',
      });
  }
  private ordered(): ModuleDefinition[] {
    const ordered: ModuleDefinition[] = [],
      visiting = new Set<string>(),
      visited = new Set<string>();
    const visit = (id: string): void => {
      if (visiting.has(id))
        throw new Error(`Circular module dependency: ${id}`);
      if (visited.has(id)) return;
      const definition = this.definition(id);
      visiting.add(id);
      for (const dependency of definition.dependencies ?? []) visit(dependency);
      visiting.delete(id);
      visited.add(id);
      ordered.push(definition);
    };
    for (const id of this.registered.keys()) visit(id);
    return ordered;
  }
  private checkDatabase(definition: ModuleDefinition): void {
    const context = this.context;
    if (!context) {
      if (this.requiresDatabase(definition.packageName))
        throw new Error(
          `Module ${definition.id} requires database initialization before readiness.`,
        );
      return;
    }
    const inventory = context.options.contributions;
    const owns = (source: { packageName: string }): boolean =>
      source.packageName === definition.packageName;
    const required = new Set<string>();
    for (const [name, sources] of Object.entries(inventory?.connections ?? {}))
      if ([...sources.migrations, ...sources.seeds].some(owns))
        required.add(name);
    if (inventory && [...inventory.migrations, ...inventory.seeds].some(owns))
      required.add(
        context.config.default ?? Object.keys(context.config.connections)[0],
      );
    for (const name of required)
      for (const kind of ['migrations', 'seeds']) {
        if (
          !this.result?.ok ||
          !this.result.results.some(
            (task) =>
              task.connection === name &&
              task.kind === kind &&
              task.status === 'completed',
          )
        )
          throw new Error(
            `Module ${definition.id} requires completed ${kind} on connection "${name}".`,
          );
      }
  }
  async ready(): Promise<void> {
    if (this.management) return this.management.ready();
    const definitions = this.ordered();
    for (const definition of definitions) this.checkDatabase(definition);
    this.started = true;
    try {
      for (const definition of definitions) {
        const cleanup: (() => Promise<void> | void)[] = [];
        this.active.set(definition.id, cleanup);
        await definition.start?.((stop) => cleanup.push(stop));
      }
    } catch (error) {
      await this.shutdown();
      throw error;
    }
  }
  async shutdown(): Promise<void> {
    if (this.management) return this.management.shutdown();
    for (const [id, cleanups] of [...this.active].reverse()) {
      while (cleanups.length) {
        await cleanups[cleanups.length - 1]();
        cleanups.pop();
      }
      this.active.delete(id);
    }
  }
}
