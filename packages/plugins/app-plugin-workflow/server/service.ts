import type { WorkflowLogger } from './engine/types.js';
import path from 'node:path';
import type { DatabaseManager } from '@nocobase/db';
import type { JobExecutor } from '@nocobase/jobs';
import type { ServiceResolver } from '@nocobase/service-provider';
import { randomUUID } from 'node:crypto';
import {
  LocalWorkflowArtifactStore,
  WorkflowLoader,
  type WorkflowDistArtifact,
} from './loader/index.js';
import {
  WorkflowEngine,
  assertInputSize,
  asIdFilter,
  loadRun,
  loadWorkflow,
  type JsonObject,
  type WorkflowDefinition,
  type WorkflowEventOptions,
  type WorkflowInstructionClass,
  type WorkflowId,
  WorkflowInvocationError,
  type WorkflowTriggerReceipt,
  validateInputValue,
} from './engine/index.js';
import type { FsDriveDiskConfig } from '@nocobase/drive';
import { anyOfIds } from './collections/filters.js';
import { workflowStore, type WorkflowStore } from './collections/store.js';
import { createWorkflowRunServices } from './engine/run-services.js';
import type { WorkflowInstructionApis } from './instructions/base.js';

export interface WorkflowServiceOptions {
  logger?: WorkflowLogger;
  database: DatabaseManager;
  executor: JobExecutor;
  services: ServiceResolver;
  sourceRoot?: string;
  distRoot: string;
  clientDir?: string;
  artifactDisk: FsDriveDiskConfig;
  production: boolean;
  terminalObserver?: import('./engine/types.js').WorkflowTerminalObserver;
  /** The application's id service; node runs and resume requests take their ids from it. */
  idGenerator?: import('@nocobase/snowflake').IdGeneratorService;
}

export class WorkflowService {
  private readonly database: DatabaseManager;
  private readonly store: LocalWorkflowArtifactStore;
  /** Development discovery root; materialized executions always use the artifact store. */
  private readonly developmentResourceRoot: string | undefined;
  private readonly engine: WorkflowEngine;
  private readonly loader: WorkflowLoader;
  private initializationPromise: Promise<void> | undefined;

  constructor(options: WorkflowServiceOptions) {
    this.database = options.database;
    this.developmentResourceRoot =
      !options.production && options.sourceRoot
        ? options.sourceRoot
        : undefined;
    this.store = new LocalWorkflowArtifactStore({
      storeRoot: options.artifactDisk.location,
    });
    this.engine = new WorkflowEngine({
      logger: options.logger,
      database: options.database,
      executor: options.executor,
      ...(options.terminalObserver === undefined
        ? {}
        : { terminalObserver: options.terminalObserver }),
      ...(options.idGenerator === undefined
        ? {}
        : { idGenerator: options.idGenerator }),
      services: createWorkflowRunServices(options.services),
      artifactStore: this.store,
    });
    this.loader = new WorkflowLoader({
      database: options.database,
      artifactStore: this.store,
      distRoot: options.distRoot,
      clientDir:
        options.clientDir ??
        path.join(path.dirname(options.distRoot), 'client'),
      // Development reads the workflow source directly, so an edited
      // `workflow.ts` is picked up without `nocobase workflow build` and
      // without restarting the server.
      ...(this.developmentResourceRoot === undefined
        ? {}
        : {
            source: {
              root: this.developmentResourceRoot,
              instructions: (): ReadonlyMap<string, WorkflowInstructionClass> =>
                this.engine.instructions,
            },
          }),
    });
  }

  /** The workflow collections. `store` here is already the Artifact store. */
  private get collections(): WorkflowStore {
    return workflowStore(this.database);
  }

  registerInstruction(instruction: WorkflowInstructionClass): void {
    this.engine.registerInstruction(instruction);
  }

  getInstructionApi<K extends keyof WorkflowInstructionApis>(
    type: K,
  ): WorkflowInstructionApis[K];
  getInstructionApi<T extends object = object>(type: string): T;
  getInstructionApi(type: string): object {
    return this.engine.getInstructionApi(type);
  }

  async trigger(
    workflowKey: string,
    input: JsonObject,
    triggerOptions: WorkflowEventOptions = {},
  ): Promise<WorkflowTriggerReceipt> {
    const row = await this.collections.workflows.findOne({
      filter: { key: workflowKey, current: true },
      select: (select) => select.fields('id', 'enabled', 'hash'),
    });
    if (!row) return { status: 'skipped', reason: 'not-found' };
    if (!triggerOptions.force && !triggerOptions.manually && !row.enabled)
      return { status: 'skipped', reason: 'disabled' };
    if (typeof row.hash === 'string')
      await this.loader.ensureMaterialized(row.hash);

    const workflow = await loadWorkflow(
      this.collections,
      row.id as string | number,
    );
    if (!workflow)
      throw new WorkflowInvocationError(
        'WORKFLOW_NOT_FOUND',
        `Workflow "${workflowKey}" was not found`,
      );

    return this.executeRevision(workflow, input, triggerOptions);
  }

  async triggerRevision(
    revisionId: WorkflowId,
    input: JsonObject,
    triggerOptions: WorkflowEventOptions = {},
  ): Promise<WorkflowTriggerReceipt> {
    const workflow = await loadWorkflow(this.collections, revisionId);
    if (!workflow)
      throw new WorkflowInvocationError(
        'WORKFLOW_NOT_FOUND',
        `Workflow revision "${String(revisionId)}" was not found`,
      );
    return this.executeRevision(workflow, input, triggerOptions);
  }

  discoverArtifacts(): Promise<readonly WorkflowDistArtifact[]> {
    return this.loader.discover();
  }

  restoreClientArtifacts(): Promise<void> {
    return this.loader.restoreClientArtifacts();
  }

  synchronizeDeploymentArtifacts(): Promise<void> {
    return this.loader.synchronizeDeploymentArtifacts();
  }

  ensureArtifactMaterialized(hash: string): Promise<WorkflowId | undefined> {
    return this.loader.ensureMaterialized(hash);
  }

  async dispose(): Promise<void> {
    try {
      await this.initializationPromise;
    } catch {
      // A failed lazy initialization still leaves engine.dispose() safe to call.
    }
    this.initializationPromise = undefined;
    await this.engine.dispose();
  }

  /** Every materialized version executes its stored resources in all environments. */
  private async assertResourcesPresent(
    workflow: WorkflowDefinition,
  ): Promise<void> {
    const hash = workflow.hash;
    if (!hash || !(await this.store.has(workflow.key, hash)))
      throw new Error(
        `Workflow Artifact ${workflow.key}/${String(hash)} is missing from this build. ` +
          'The database still points at the hash of an earlier build, so enable the version this build deployed: ' +
          'choose "Enable new version" on the workflow in workflow management, or call POST /api/workflows/<hash>/enable with the new hash. ' +
          'Enabling by workflow id keeps the missing hash.',
      );
  }

  private ensureInitialized(): Promise<void> {
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this.engine
      .initialize()
      .catch((error: unknown) => {
        this.initializationPromise = undefined;
        throw error;
      });
    return this.initializationPromise;
  }

  private async executeRevision(
    workflow: WorkflowDefinition,
    input: JsonObject,
    triggerOptions: WorkflowEventOptions = {},
  ): Promise<WorkflowTriggerReceipt> {
    if (!triggerOptions.force && !triggerOptions.manually && !workflow.enabled)
      return { status: 'skipped', reason: 'disabled' };

    await this.assertResourcesPresent(workflow);

    assertInputSize(input);
    const validation = validateInputValue(workflow.inputSchema, input);
    if (!validation.valid)
      throw new WorkflowInvocationError(
        'INVALID_INPUT',
        `Workflow "${workflow.key}" input is invalid`,
        validation.issues,
      );

    let stack = triggerOptions.stack ? [...triggerOptions.stack] : undefined;
    if (stack === undefined && triggerOptions.parentRunId !== undefined) {
      const parent = await loadRun(
        this.collections,
        triggerOptions.parentRunId,
      );
      if (!parent)
        throw new WorkflowInvocationError(
          'PARENT_RUN_NOT_FOUND',
          `Parent run "${String(triggerOptions.parentRunId)}" was not found`,
        );
      stack = [...parent.stack, parent.id];
    }
    if (stack?.length) {
      const repeats = await this.collections.runs.count({
        filter: (filter) =>
          filter.and([
            filter.number('workflowId').eq(asIdFilter(workflow.id)),
            anyOfIds(filter, 'id', stack),
          ]),
      });
      const limit = Number(workflow.options.stackLimit ?? 1);
      if (repeats >= limit)
        throw new WorkflowInvocationError(
          'STACK_LIMIT_EXCEEDED',
          `Workflow "${workflow.key}" stack limit ${limit} was exceeded`,
        );
    }

    await this.ensureInitialized();
    const eventKey = triggerOptions.eventKey ?? randomUUID();
    const execution = await this.engine.trigger(workflow, input, {
      ...triggerOptions,
      eventKey,
      ...(triggerOptions.parentRunId === undefined
        ? {}
        : { parentRunId: triggerOptions.parentRunId }),
      ...(stack === undefined ? {} : { stack }),
    });
    if (execution && typeof execution === 'object' && 'id' in execution)
      return { status: 'accepted', eventKey, runId: String(execution.id) };
    const run = await this.findAcceptedRun(eventKey);
    return { status: 'accepted', eventKey, runId: String(run.id) };
  }

  private async findAcceptedRun(eventKey: string): Promise<{ id: unknown }> {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const run = await this.collections.runs.findOne({
        filter: { eventKey },
        select: (select) => select.fields('id'),
      });
      if (run) return run;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(
      `Workflow Run for accepted event "${eventKey}" was not found`,
    );
  }
}

export type WorkflowServiceApi = Pick<
  WorkflowService,
  | 'trigger'
  | 'triggerRevision'
  | 'discoverArtifacts'
  | 'ensureArtifactMaterialized'
>;
