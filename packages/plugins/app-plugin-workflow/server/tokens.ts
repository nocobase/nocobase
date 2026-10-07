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
    '@nocobase/app-plugin-workflow/service',
  );

export const internalWorkflowServiceToken: ServiceToken<WorkflowService> =
  createServiceToken<WorkflowService>(
    '@nocobase/app-plugin-workflow/internal-service',
  );
