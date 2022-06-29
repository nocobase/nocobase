import { get as getWithPath } from 'lodash';
import { Registry } from "@nocobase/utils";

import JobModel from '../models/Job';
import Processor from '../Processor';

export const calculators = new Registry<Function>();

export default calculators;


export type OperandType = '$context' | '$input' | '$jobsMapByNodeId' | '$calculation';

export type ObjectGetterOptions = {
  path?: string
};

export type JobGetterOptions = ObjectGetterOptions & {
  nodeId: number
};

export type CalculationOptions = {
  calculator: string,
  operands: Operand[]
};

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
export type Operand = ContextOperand | InputOperand | JobOperand | ConstantOperand | Calculation;

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
export function calculate(operand: Operand, lastJob: JobModel, processor: Processor) {
  switch (operand.type) {
    // @Deprecated
    // from execution context
    case '$context':
      return get(processor.execution.context, operand.options.path);

    // @Deprecated
    // from last job (or input job)
    case '$input':
      return lastJob ?? get(lastJob.result, operand.options.path);

    // @Deprecated
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



function add(...args) {
  return args.reduce((sum, a) => sum + a, 0);
}

function minus(a, b) {
  return a - b;
}

function multiple(...args) {
  return args.reduce((result, a) => result * a, 1);
}

function divide(a, b) {
  return a / b;
}

function mod(a, b) {
  return a % b;
}

calculators.register('add', add);
calculators.register('minus', minus);
calculators.register('multiple', multiple);
calculators.register('divide', divide);
calculators.register('mod', mod);

calculators.register('+', add);
calculators.register('-', minus);
calculators.register('*', multiple);
calculators.register('/', divide);
calculators.register('%', mod);

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

function before(a: string, b: string) {
  return a < b;
}

calculators.register('now', () => new Date());

// TODO: add more common calculators
