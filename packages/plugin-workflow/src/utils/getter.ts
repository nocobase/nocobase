import { get } from 'lodash';

import { ModelCtor } from '@nocobase/database';
import { ExecutionModel } from '../models/Execution';

export type OperandType = 'context' | 'input' | 'job';

export type ObjectGetterOptions = {
  path?: string
};

export type JobGetterOptions = ObjectGetterOptions & {
  id: number
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

export type Operand = ContextOperand | InputOperand | JobOperand | ConstantOperand;

// TODO: other instructions may also use this method, could be moved to utils.
export function getValue(operand: Operand, input: any, execution: ModelCtor<ExecutionModel>) {
  switch (operand.type) {
    // from execution context
    case 'context':
      return get(execution, operand.options.path);
    // from input from last job or manual
    case 'input':
      return get(input, operand.options.path);
    // from job in execution
    case 'job':
      // assume jobs have been fetched from execution before
      const job = execution.jobs.find(item => item.id === operand.options.id);
      return get(job, operand.options.path);
    // constant
    default:
      return operand.value;
  }
}
