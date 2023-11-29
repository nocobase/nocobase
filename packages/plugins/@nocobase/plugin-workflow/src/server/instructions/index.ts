import path from 'path';

import { Transactionable } from '@nocobase/database';

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
export abstract class Instruction {
  constructor(public plugin: Plugin) {}

  abstract run(node: FlowNodeModel, input: any, processor: Processor): InstructionResult;

  resume?(node: FlowNodeModel, input: any, processor: Processor): InstructionResult;

  getScope?(node: FlowNodeModel, data: any, processor: Processor): any;

  duplicateConfig?(node: FlowNodeModel, options: Transactionable): object | Promise<object>;
}

type InstructionConstructor = { new (plugin: Plugin): Instruction };

export default async function <T extends Instruction>(
  plugin,
  more: { [key: string]: T | InstructionConstructor } = {},
) {
  const { instructions } = plugin;

  const natives = await ['calculation', 'condition', 'query', 'create', 'update', 'destroy'].reduce(
    (promise, key) =>
      promise.then(async (result) =>
        Object.assign(result, {
          [key]: (await import(path.isAbsolute(key) ? key : path.join(__dirname, key))).default,
        }),
      ),
    Promise.resolve({}),
  );

  for (const [name, instruction] of Object.entries({ ...more, ...natives })) {
    instructions.register(
      name,
      typeof instruction === 'function' ? new (instruction as InstructionConstructor)(plugin) : instruction,
    );
  }
}
