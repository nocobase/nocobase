export * from './base.js';
import type { WorkflowInstructionClass } from './base.js';
import { ConditionInstruction } from './condition/instruction.js';
import { TerminateInstruction } from './terminate/instruction.js';
import { RunInstruction } from './run/instruction.js';
import { WaitInstruction } from './wait/instruction.js';

export const INSTRUCTION_TYPES: {
  readonly condition: 'condition';
  readonly terminate: 'terminate';
  readonly run: 'run';
  readonly wait: 'wait';
} = {
  condition: 'condition',
  terminate: 'terminate',
  run: 'run',
  wait: 'wait',
};

export type InstructionType =
  (typeof INSTRUCTION_TYPES)[keyof typeof INSTRUCTION_TYPES];

export const coreInstructions: ReadonlyMap<string, WorkflowInstructionClass> =
  new Map<string, WorkflowInstructionClass>([
    [ConditionInstruction.type, ConditionInstruction],
    [TerminateInstruction.type, TerminateInstruction],
    [RunInstruction.type, RunInstruction],
    [WaitInstruction.type, WaitInstruction],
  ]);

export {
  ConditionInstruction,
  CONDITION_BRANCH_KEYS,
  validateConditionConfig,
} from './condition/instruction.js';
export type {
  ConditionBranchKey,
  ConditionConfig,
} from './condition/instruction.js';

export {
  TerminateInstruction,
  TERMINATE_OUTCOMES,
  validateTerminateConfig,
} from './terminate/instruction.js';
export type {
  TerminateConfig,
  TerminateOutcome,
} from './terminate/instruction.js';

export {
  assertWorkflowRunResult,
  RunInstruction,
  validateRunConfig,
} from './run/instruction.js';
export type {
  RunConfig,
  WorkflowRunArgs,
  WorkflowRunFunction,
  WorkflowRunJsonValue,
  WorkflowRunModule,
  WorkflowRunOptions,
} from './run/instruction.js';
export type { WorkflowRunServices } from '../engine/run-services.js';
export { WaitInstruction } from './wait/instruction.js';
export { WaitInstructionApi } from './wait/api.js';
export type {
  WaitDecision,
  WaitLookup,
  WaitResumeReceipt,
  WaitTarget,
} from './wait/api.js';
export type { ConditionDataBindings } from './condition/types.js';

export * from '../../dsl/definition.js';
export * from './types.js';
