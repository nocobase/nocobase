import { get as getWithPath } from 'lodash';

import ExecutionModel from '../models/Execution';
import JobModel from '../models/Job';

export type OperandType = 'context' | 'input' | 'job';

export type ObjectGetterOptions = {
  path?: string
};

export type JobGetterOptions = ObjectGetterOptions & {
  nodeId: number
};

export type ConstantOperand = {
  type?: 'constant';
  value: any
};

export type ContextOperand = {
  type: 'context';
  options: ObjectGetterOptions;
};

export type InputOperand = {
  type: 'input';
  options: ObjectGetterOptions;
};

export type JobOperand = {
  type: 'job';
  options: JobGetterOptions;
};

// TODO(type): union type here is wrong
export type Operand = ContextOperand | InputOperand | JobOperand | ConstantOperand;

// HACK: if no path provided, return self
// @see https://github.com/lodash/lodash/pull/1270
// TODO(question): should add default value as lodash?
function get(object, path?: string | Array<string>) {
  return path == null || !path.length ? object : getWithPath(object, path);
}


// NOTE:
//  this method could only be used in executing nodes.
//  because type of 'job' need loaded jobs in runtime execution.
//  or the execution should be prepared first.
export function getValue(operand: Operand, lastJob: JobModel, execution: ExecutionModel) {
  switch (operand.type) {
    // from execution context
    case 'context':
      return get(execution.context, operand.options.path);
    // from last job (or input job)
    case 'input':
      return lastJob ?? get(lastJob.result, operand.options.path);
    // from job in execution
    case 'job':
      // assume jobs have been fetched from execution before
      // TODO: searching should consider cycle, and from lastJob
      const job = Array.from(execution.jobsMap.values()).find(item => item.nodeId === operand.options.nodeId);
      return job && get(job.result, operand.options.path);
    // constant
    default:
      return operand.value;
  }
}
