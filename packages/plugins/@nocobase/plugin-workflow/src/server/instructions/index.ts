import path from 'path';

import { requireModule } from '@nocobase/utils';

import Plugin from '..';
import Processor from '../Processor';

import type { FlowNodeModel } from '../types';

export interface IJob {
  status: number;
  result?: unknown;
  [key: string]: unknown;
}

export type InstructionResult = IJob | Promise<IJob> | null;

export type Runner = (node: FlowNodeModel, input: any, processor: Processor) => InstructionResult;

// what should a instruction do?
// - base on input and context, do any calculations or system call (io), and produce a result or pending.
export interface Instruction {
  run: Runner;

  // for start node in main flow (or branch) to resume when manual sub branch triggered
  resume?: Runner;

  getScope?: (node: FlowNodeModel, job: any, processor: Processor) => any;
}

type InstructionConstructor<T> = { new (p: Plugin): T };

export default function <T extends Instruction>(plugin, more: { [key: string]: T | InstructionConstructor<T> } = {}) {
  const { instructions } = plugin;

  const natives = [
    'calculation',
    'condition',
    'parallel',
    'loop',
    'delay',
    'manual',
    'query',
    'create',
    'update',
    'destroy',
    'aggregate',
    'request',
    'sql',
  ].reduce(
    (result, key) =>
      Object.assign(result, {
        [key]: requireModule(path.isAbsolute(key) ? key : path.join(__dirname, key)),
      }),
    {},
  );

  for (const [name, instruction] of Object.entries({ ...more, ...natives })) {
    instructions.register(
      name,
      typeof instruction === 'function' ? new (instruction as InstructionConstructor<T>)(plugin) : instruction,
    );
  }
}
