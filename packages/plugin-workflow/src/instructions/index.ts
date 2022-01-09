// something like template for type of nodes

import { ModelCtor, Model } from "@nocobase/database";
import { ExecutionModel } from "../models/Execution";

import echo from './echo';
import prompt from './prompt';
import condition from './condition';

// what should a instruction do?
// - base on input and context, do any calculations or system call (io), and produce a result or pending.
// what should input to be?
// - just use previously output result for convenience?
// what should context to be?
// - could be the workflow execution object (containing context data)
export type Instruction = {
  manual: boolean;
  run(
    this: ModelCtor<Model>,
    input: any,
    execution: ModelCtor<ExecutionModel>
  ): any
}

const registery = new Map<string, Instruction>();

export function getInstruction(key: string): Instruction {
  return registery.get(key);
}

export function registerInstruction(key: string, fn: Instruction) {
  registery.set(key, fn);
}

registerInstruction('echo', echo);
registerInstruction('prompt', prompt);
registerInstruction('condition', condition);
