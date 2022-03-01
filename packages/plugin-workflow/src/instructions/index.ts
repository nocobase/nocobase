import { Registry } from '@nocobase/utils';

import ExecutionModel from '../models/Execution';
import FlowNodeModel from '../models/FlowNode';

import prompt from './prompt';
import calculation from './calculation';
import condition from './condition';
import parallel from './parallel';
import query from './query';
import create from './create';
import update from './update';
import destroy from './destroy';

export interface Job {
  status: number;
  result?: unknown;
  [key: string]: unknown;
}

export type InstructionResult = Job | Promise<Job>;

// what should a instruction do?
// - base on input and context, do any calculations or system call (io), and produce a result or pending.
export interface Instruction {
  run(
    this: FlowNodeModel,
    // what should input to be?
    // - just use previously output result for convenience?
    input: any,
    // what should context to be?
    // - could be the workflow execution object (containing context data)
    execution: ExecutionModel
  ): InstructionResult;

  // for start node in main flow (or branch) to resume when manual sub branch triggered
  resume?(
    this: FlowNodeModel,
    input: any,
    execution: ExecutionModel
  ): InstructionResult
}

export const instructions = new Registry<Instruction>();

instructions.register('prompt', prompt);
instructions.register('calculation', calculation);
instructions.register('condition', condition);
instructions.register('parallel', parallel);
instructions.register('query', query);
instructions.register('create', create);
instructions.register('update', update);
instructions.register('destroy', destroy);

export default instructions;
