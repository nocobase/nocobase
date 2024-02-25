import { evaluators } from '@nocobase/evaluators';
import { Registry } from '@nocobase/utils';
import { Instruction } from '.';
import type Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import type { FlowNodeModel, JobModel } from '../types';

type Comparer = (a: any, b: any) => boolean;

export const BRANCH_INDEX = {
  DEFAULT: null,
  ON_TRUE: 1,
  ON_FALSE: 0,
} as const;

export const calculators = new Registry<Comparer>();

// built-in functions
function equal(a, b) {
  return a == b;
}

function notEqual(a, b) {
  return a != b;
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

calculators.register('==', equal);
calculators.register('!=', notEqual);
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

type CalculationItem = {
  calculator?: string;
  operands?: [any?, any?];
};

type CalculationGroup = {
  group: {
    type: 'and' | 'or';
    calculations?: Calculation[];
  };
};

type Calculation = CalculationItem | CalculationGroup;

function calculate(calculation: CalculationItem = {}) {
  type NewType = Comparer;

  let fn: NewType;
  if (!(calculation.calculator && (fn = calculators.get(calculation.calculator)))) {
    throw new Error(`no calculator function registered for "${calculation.calculator}"`);
  }
  return Boolean(fn(...(calculation.operands ?? [])));
}

function logicCalculate(calculation?: Calculation) {
  if (!calculation) {
    return true;
  }

  if (typeof calculation['group'] === 'object') {
    const method = calculation['group'].type === 'and' ? 'every' : 'some';
    return (calculation['group'].calculations ?? [])[method]((item: Calculation) => logicCalculate(item));
  }

  return calculate(calculation as CalculationItem);
}

export class ConditionInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { engine, calculation, expression, rejectOnFalse } = node.config || {};
    const evaluator = evaluators.get(engine);

    let result = true;

    try {
      result = evaluator
        ? evaluator(expression, processor.getScope(node.id))
        : logicCalculate(processor.getParsedValue(calculation, node.id));
    } catch (e) {
      return {
        result: e.toString(),
        status: JOB_STATUS.ERROR,
      };
    }

    if (!result && rejectOnFalse) {
      return {
        status: JOB_STATUS.FAILED,
        result,
      };
    }

    const job = {
      status: JOB_STATUS.RESOLVED,
      result,
      // TODO(optimize): try unify the building of job
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: (prevJob && prevJob.id) || null,
    };

    const branchNode = processor.nodes.find(
      (item) => item.upstreamId === node.id && item.branchIndex != null && Boolean(item.branchIndex) === result,
    );

    if (!branchNode) {
      return job;
    }

    const savedJob = await processor.saveJob(job);

    await processor.run(branchNode, savedJob);

    return null;
  }

  async resume(node: FlowNodeModel, branchJob: JobModel, processor: Processor) {
    const job = processor.findBranchParentJob(branchJob, node) as JobModel;

    if (branchJob.status === JOB_STATUS.RESOLVED) {
      // return to continue node.downstream
      return job;
    }

    // pass control to upper scope by ending current scope
    return processor.exit(branchJob.status);
  }
}

export default ConditionInstruction;
