import axios, { AxiosRequestConfig } from 'axios';

import { Instruction } from './index';
import { JOB_STATUS } from '../constants';
import Processor from '../Processor';
import FlowNodeModel from '../models/FlowNode';

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
  const params = (config.params ?? []).reduce((result, param) => Object.assign(result, { [param.name]: param.value }), {});

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
};

export default class implements Instruction {
  constructor(public plugin) {}

  async run(node: FlowNodeModel, input, processor: Processor) {
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
    });

    const config = processor.getParsedValue(node.config) as RequestConfig;

    request(config)
      .then(response => {
        job.set({
          status: JOB_STATUS.RESOLVED,
          result: response.data
        });
      })
      .catch(error => {
        job.set({
          status: JOB_STATUS.REJECTED,
          result: error.isAxiosError ? error.toJSON() : error.message
        });
      })
      .finally(() => {
        this.plugin.app.logger.info(`[Workflow] request (#${node.id}) response received, status: ${job.get('status')}`);
        this.plugin.resume(job);
      });

    this.plugin.app.logger.info(`[Workflow] request (#${node.id}) sent to "${config.url}", waiting for response...`);

    return job;
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    const { ignoreFail } = node.config as RequestConfig;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
