import { JOB_STATUS } from "../constants";

export default {
  run(this, input, execution) {
    return {
      status: JOB_STATUS.PENDING
    };
  },

  resume(this, job, execution) {
    job.set('status', JOB_STATUS.RESOLVED);
    return job;
  }
}
