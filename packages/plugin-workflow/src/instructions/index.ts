import ExecutionModel from "../models/Execution";
import FlowNodeModel from "../models/FlowNode";

import prompt from './prompt';
import condition from './condition';
// import parallel from './parallel';

export interface Job {
  status: number;
  result: unknown;
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
  resume?(): InstructionResult
}

const registery = new Map<string, Instruction>();

export function getInstruction(key: string): Instruction {
  return registery.get(key);
}

export function registerInstruction(key: string, instruction: any) {
  registery.set(key, instruction);
}

registerInstruction('prompt', prompt);
registerInstruction('condition', condition);
// registerInstruction('parallel', parallel);
