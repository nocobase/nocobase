import path from 'path';

import { requireModule } from '@nocobase/utils';

import FlowNodeModel from '../models/FlowNode';

import Plugin from '..';
import Processor from '../Processor';

import prompt from './prompt';
import calculation from './calculation';
import condition from './condition';
import parallel from './parallel';
import query from './query';
import create from './create';
import update from './update';
import destroy from './destroy';

export type Job = {
  status: number;
  result?: unknown;
  [key: string]: unknown;
} | null;

export type InstructionResult = Job | Promise<Job>;

// what should a instruction do?
// - base on input and context, do any calculations or system call (io), and produce a result or pending.
export interface Instruction {
  run(
    node: FlowNodeModel,
    // what should input to be?
    // - just use previously output result for convenience?
    input: any,
    // what should context to be?
    // - could be the workflow execution object (containing context data)
    processor: Processor
  ): InstructionResult;

  // for start node in main flow (or branch) to resume when manual sub branch triggered
  resume?(
    node: FlowNodeModel,
    input: any,
    processor: Processor
  ): InstructionResult
}

export default function<T extends Instruction>(
  plugin,
  more: { [key: string]: T | { new(p: Plugin): T } } = {}
) {
  const { instructions } = plugin;

  instructions.register('prompt', prompt);
  instructions.register('calculation', calculation);
  instructions.register('condition', condition);
  instructions.register('parallel', parallel);
  instructions.register('query', query);
  instructions.register('create', create);
  instructions.register('update', update);
  instructions.register('destroy', destroy);

  instructions.register('delay', new (requireModule(path.join(__dirname, 'delay')))(plugin));

  for (const [name, instruction] of Object.entries(more)) {
    instructions.register(name, typeof instruction === 'function' ? new instruction(plugin) : instruction);
  }
}
