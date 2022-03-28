import { get as getWithPath } from 'lodash';
import { Registry } from "@nocobase/utils";

import ExecutionModel from '../models/Execution';
import JobModel from '../models/Job';

export const calculators = new Registry<Function>();

export default calculators;


export type OperandType = 'context' | 'input' | 'job' | 'calculation';

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

export type Calculation = {
  type: 'calculation';
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
export function calculate(operand: Operand, lastJob: JobModel, execution: ExecutionModel) {
  switch (operand.type) {
    // @Deprecated
    // from execution context
    case 'context':
      return get(execution.context, operand.options.path);

    // @Deprecated
    // from last job (or input job)
    case 'input':
      return lastJob ?? get(lastJob.result, operand.options.path);

    // @Deprecated
    // from job in execution
    case 'job':
      // assume jobs have been fetched from execution before
      const job = execution.jobsMapByNodeId[operand.options.nodeId];
      return job && get(job, operand.options.path);

    case 'calculation':
      const fn = calculators.get(operand.options.calculator);
      if (!fn) {
        throw new Error(`no calculator function registered for "${operand.options.calculator}"`);
      }
      return fn(...operand.options.operands.map(item => calculate(item, lastJob, execution)));

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

function multipe(...args) {
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
calculators.register('multipe', multipe);
calculators.register('divide', divide);
calculators.register('mod', mod);

calculators.register('+', add);
calculators.register('-', minus);
calculators.register('*', multipe);
calculators.register('/', divide);
calculators.register('%', mod);

calculators.register('now', () => new Date());

// TODO: add more common calculators
