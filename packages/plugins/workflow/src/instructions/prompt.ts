import { JOB_STATUS } from "../constants";

export default {
  run(this, input, processor) {
    return {
      status: JOB_STATUS.PENDING
    };
  },

  resume(this, job, processor) {
    job.set('status', JOB_STATUS.RESOLVED);
    return job;
  }
};
