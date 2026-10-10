import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  JsonObject,
  WorkflowEventOptions,
  WorkflowInstructionClass,
  WorkflowTriggerReceipt,
} from './engine/index.js';
import type { WorkflowService } from './service.js';
import type { WorkflowSourceRegistry } from './sources.js';
import type { WorkflowInstructionApis } from './instructions/base.js';

export interface WorkflowServiceContract {
  registerInstruction(instruction: WorkflowInstructionClass): void;
  /** The runtime API of a registered instruction, such as the Wait API. */
  getInstructionApi<K extends keyof WorkflowInstructionApis>(
    type: K,
  ): WorkflowInstructionApis[K];
  getInstructionApi<T extends object = object>(type: string): T;
  trigger(
    workflowKey: string,
    input: JsonObject,
    options?: WorkflowEventOptions,
  ): Promise<WorkflowTriggerReceipt>;
}

export const workflowServiceToken: ServiceToken<WorkflowServiceContract> =
  createServiceToken<WorkflowServiceContract>(
    '@nocobase/app-plugin-dag-flow/service',
  );

export const internalWorkflowServiceToken: ServiceToken<WorkflowService> =
  createServiceToken<WorkflowService>(
    '@nocobase/app-plugin-dag-flow/internal-service',
  );

/**
 * Where plugins register the workflow packages they ship. It is available from
 * this plugin's `register()` on, whether or not a database is configured.
 */
export const workflowSourcesToken: ServiceToken<WorkflowSourceRegistry> =
  createServiceToken<WorkflowSourceRegistry>(
    '@nocobase/app-plugin-dag-flow/sources',
  );
