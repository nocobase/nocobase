/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transactionable } from '@nocobase/database';

import type Plugin from '../Plugin';
import type Processor from '../Processor';

import type { FlowNodeModel } from '../types';

export interface IJob {
  status: number;
  result?: unknown;
  [key: string]: unknown;
}

/**
 * The result of an instruction execution.
 *
 * Different type of result will cause according behavior in the workflow engine:
 * 1. IJob | Promise<IJob>: processor will continue default processing by checking the status.
 * 2. `null` | Promise<null>: processor will do exit process.
 * 3. `void` | Promise<void>: processor will do nothing, and terminate the current execution without any action.
 */
export type InstructionResult = IJob | Promise<IJob> | Promise<void> | Promise<null> | null | void;

export type Runner = (node: FlowNodeModel, input: any, processor: Processor) => InstructionResult;

export type InstructionInterface = {
  run: Runner;
  resume?: Runner;
  getScope?: (node: FlowNodeModel, data: any, processor: Processor) => any;
  duplicateConfig?: (
    node: FlowNodeModel,
    options: Transactionable & { origin?: FlowNodeModel },
  ) => object | Promise<object>;
  test?: (config: Record<string, any>) => IJob | Promise<IJob>;
};

// what should a instruction do?
// - base on input and context, do any calculations or system call (io), and produce a result or pending.
export abstract class Instruction implements InstructionInterface {
  constructor(public workflow: Plugin) {}

  abstract run(node: FlowNodeModel, input: any, processor: Processor): InstructionResult;
}

export default Instruction;
