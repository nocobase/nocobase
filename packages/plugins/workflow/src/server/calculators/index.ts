import { toNumber, get as getWithPath } from 'lodash';
import { Registry } from "@nocobase/utils";

import JobModel from '../models/Job';
import Processor from '../Processor';

export const calculators = new Registry<Function>();

export default calculators;


export type OperandType = '$context' | '$input' | '$jobsMapByNodeId' | '$calculation';

export type ObjectGetterOptions = {
  type?: string;
  path?: string;
};

export type JobGetterOptions = ObjectGetterOptions & {
  nodeId: number
};

export type CalculationOptions = {
  calculator: string,
  operands: Operand[]
};

export type ValueOperand = string | number | boolean | null | Date;

export type ConstantOperand = {
  type?: 'constant';
  value: any
};

export type ContextOperand = {
  type: '$context';
  options: ObjectGetterOptions;
};

export type InputOperand = {
  type: '$input';
  options: ObjectGetterOptions;
};

export type JobOperand = {
  type: '$jobsMapByNodeId';
  options: JobGetterOptions;
};

export type Calculation = {
  type: '$calculation';
  options: CalculationOptions
};

// TODO(type): union type here is wrong
export type Operand = ValueOperand | ContextOperand | InputOperand | JobOperand | ConstantOperand | Calculation;

// @deprecated
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
export function calculate(operand, lastJob: JobModel, processor: Processor) {
  if (typeof operand !== 'object' || operand == null) {
    return operand;
  }
  // @Deprecated
  switch (operand.type) {
    // from execution context
    case '$context':
      return get(processor.execution.context, [operand.options.type, operand.options.path].filter(Boolean).join('.'));

    // from last job (or input job)
    case '$input':
      return lastJob ?? get(lastJob.result, operand.options.path);

    // from job in execution
    case '$jobsMapByNodeId':
      // assume jobs have been fetched from execution before
      const job = processor.jobsMapByNodeId[operand.options.nodeId];
      return job && get(job, operand.options.path);

    case '$calculation':
      const fn = calculators.get(operand.options.calculator);
      if (!fn) {
        throw new Error(`no calculator function registered for "${operand.options.calculator}"`);
      }
      return fn(...operand.options.operands.map(item => calculate(item, lastJob, processor)));

    // constant
    default:
      return operand.value;
  }
}



// built-in functions

function equal(a, b) {
  return a === b;
}

function notEqual(a, b) {
  return a !== b;
}

function gt(a, b) {
  return a > b;
}

function gte(a, b) {
  return a >= b;
}

function lt(a, b) {
  return a < b;
}

function lte(a, b) {
  return a <= b;
}

calculators.register('equal', equal);
calculators.register('notEqual', notEqual);
calculators.register('gt', gt);
calculators.register('gte', gte);
calculators.register('lt', lt);
calculators.register('lte', lte);

calculators.register('===', equal);
calculators.register('!==', notEqual);
calculators.register('>', gt);
calculators.register('>=', gte);
calculators.register('<', lt);
calculators.register('<=', lte);



function includes(a, b) {
  return a.includes(b);
}

function notIncludes(a, b) {
  return !a.includes(b);
}

function startsWith(a: string, b: string) {
  return a.startsWith(b);
}

function notStartsWith(a: string, b: string) {
  return !a.startsWith(b);
}

function endsWith(a: string, b: string) {
  return a.endsWith(b);
}

function notEndsWith(a: string, b: string) {
  return !a.endsWith(b);
}

calculators.register('includes', includes);
calculators.register('notIncludes', notIncludes);
calculators.register('startsWith', startsWith);
calculators.register('notStartsWith', notStartsWith);
calculators.register('endsWith', endsWith);
calculators.register('notEndsWith', notEndsWith);

// TODO: add more common calculators
