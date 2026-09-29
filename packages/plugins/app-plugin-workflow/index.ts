export { Type } from '@sinclair/typebox';
export type { Static } from '@sinclair/typebox';

export {
  ConditionInstruction,
  TERMINATE_OUTCOMES,
  TerminateInstruction,
  RunInstruction,
} from './server/instructions/index.js';
export type {
  TerminateConfig,
  TerminateOutcome,
} from './server/instructions/terminate/instruction.js';

export {
  compileToFlatIr,
  createNodeExpression,
  defineWorkflow,
  restoreFromFlatIr,
} from './dsl/definition.js';
export type * from './server/instructions/types.js';
export type {
  WorkflowRunFunction,
  WorkflowRunJsonValue,
  WorkflowRunOptions,
} from './server/instructions/run/instruction.js';
export type { WorkflowRunServices } from './server/engine/run-services.js';

// The typed authoring DSL. A `workflow.ts` imports these to build a definition.
export {
  createConditionInstruction,
  createRunInstruction,
  createTerminateInstruction,
  defineHandler,
  workflow,
} from './dsl/index.js';
export type {
  ContextOf,
  ConditionBranches,
  ConditionBuilder,
  DefinedHandler,
  Ref,
  RunBuilder,
  SurfaceRef,
  TerminateBuilder,
  UntypedRef,
  WorkflowBuilder,
  WorkflowNode,
  WorkflowSource,
  WorkflowSurface,
} from './dsl/index.js';
export type { ConditionDataBindings } from './server/instructions/condition/types.js';

export type { WorkflowHandlerContext } from './shared/handler-context.js';
