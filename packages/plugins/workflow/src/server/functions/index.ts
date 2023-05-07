import Plugin from '..';
import ExecutionModel from '../models/Execution';
import FlowNodeModel from '../models/FlowNode';

export type CustomFunction = (this: { execution: ExecutionModel; node?: FlowNodeModel }) => any;

function now() {
  return new Date();
}

export default function ({ functions }: Plugin, more: { [key: string]: CustomFunction } = {}) {
  functions.register('now', now);

  for (const [name, fn] of Object.entries(more)) {
    functions.register(name, fn);
  }
}
