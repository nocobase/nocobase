import { JOB_STATUS } from "../constants";

export default {
  run(node, input, processor) {
    return {
      status: JOB_STATUS.PENDING
    };
  },

  resume(node, job, processor) {
    job.set('status', JOB_STATUS.RESOLVED);
    return job;
  }
};
