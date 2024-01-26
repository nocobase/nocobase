import Instruction from '.';
import Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import { FlowNodeModel } from '../types';

interface Config {
  endStatus: number;
}

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { endStatus } = <Config>node.config;
    return {
      status: endStatus ?? JOB_STATUS.RESOLVED,
    };
  }
}
