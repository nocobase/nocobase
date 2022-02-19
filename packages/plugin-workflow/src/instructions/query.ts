import parse from 'json-templates';
import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";
import JobModel from '../models/Job';

// params
// const parameters = {
//   filter: {
//     a: {
//       '$gt': '{{$context.data.a}}'
//     },
//     b: {
//       '$lt': '{{$jobsMapByNodeId.1}}'
//     }
//   }
// };

export default {
  async run(this: FlowNodeModel, input, execution) {
    const {
      collection,
      multiple,
      params = {}
    } = this.config;

    // TODO(optimize): data structure here no so good.
    // a better way is try to support arguments in function of json-template.
    const $jobsMapByNodeId = {};
    Array.from(execution.jobsMap.values()).forEach((job: JobModel) => {
      $jobsMapByNodeId[job.nodeId] = job.result;
    });

    const repo = (<typeof FlowNodeModel>this.constructor).database.getRepository(collection);
    const options = parse(params)({
      $context: execution.context,
      $jobsMapByNodeId
    });
    const result = await (multiple ? repo.find : repo.findOne).call(repo, options);

    return {
      result,
      status: JOB_STATUS.RESOLVED
    };
  }
}
