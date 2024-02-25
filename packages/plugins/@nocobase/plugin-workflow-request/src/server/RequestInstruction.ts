import axios, { AxiosRequestConfig } from 'axios';

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

export interface Header {
  name: string;
  value: string;
}

export type RequestConfig = Pick<AxiosRequestConfig, 'url' | 'method' | 'params' | 'data' | 'timeout'> & {
  headers: Array<Header>;
  ignoreFail: boolean;
};

async function request(config) {
  // default headers
  const { url, method = 'POST', data, timeout = 5000 } = config;
  const headers = (config.headers ?? []).reduce((result, header) => {
    if (header.name.toLowerCase() === 'content-type') {
      return result;
    }
    return Object.assign(result, { [header.name]: header.value });
  }, {});
  const params = (config.params ?? []).reduce(
    (result, param) => Object.assign(result, { [param.name]: param.value }),
    {},
  );

  // TODO(feat): only support JSON type for now, should support others in future
  headers['Content-Type'] = 'application/json';

  return axios.request({
    url,
    method,
    headers,
    params,
    data,
    timeout,
  });
}

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const config = processor.getParsedValue(node.config, node.id) as RequestConfig;

    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    if (sync) {
      try {
        const response = await request(config);
        return {
          status: JOB_STATUS.RESOLVED,
          result: response.data,
        };
      } catch (error) {
        return {
          status: JOB_STATUS.FAILED,
          result: error.isAxiosError ? error.toJSON() : error.message,
        };
      }
    }

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // eslint-disable-next-line promise/catch-or-return
    request(config)
      .then((response) => {
        job.set({
          status: JOB_STATUS.RESOLVED,
          result: response.data,
        });
      })
      .catch((error) => {
        job.set({
          status: JOB_STATUS.FAILED,
          result: error.isAxiosError ? error.toJSON() : error.message,
        });
      })
      .finally(() => {
        processor.logger.info(`request (#${node.id}) response received, status: ${job.get('status')}`);
        this.workflow.resume(job);
      });

    processor.logger.info(`request (#${node.id}) sent to "${config.url}", waiting for response...`);

    return processor.exit();
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    const { ignoreFail } = node.config as RequestConfig;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
