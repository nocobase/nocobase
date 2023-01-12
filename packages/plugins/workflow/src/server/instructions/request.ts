import { render } from 'ejs';
import axios, { AxiosRequestConfig } from 'axios';
import _ from 'lodash';

import { Instruction } from './index';
import { JOB_STATUS } from '../constants';

export interface Header {
  name: string;
  value: string;
}

export type RequestConfig = Pick<AxiosRequestConfig, 'url' | 'method' | 'data' | 'timeout'> & {
  headers: Array<Header>;
  ignoreFail: boolean;
};

export default class implements Instruction {
  constructor(public plugin) {}

  request = async (node, job, processor) => {
    const templateVars = {
      node: processor.jobsMapByNodeId,
      ctx: processor.execution.context,
      $jobsMapByNodeId: processor.jobsMapByNodeId,
      $context: processor.execution.context,
    };
    const requestConfig = node.config as RequestConfig;

    // default headers
    const headers = {
      'Content-Type': 'application/json',
    };
    const { headers: headerArr = [], method = 'POST', timeout = 5000 } = requestConfig;
    headerArr.forEach((header) => (headers[header.name] = header.value));

    let url, data;
    try {
      url = await render(requestConfig.url!.trim(), templateVars, { async: true });
      if (requestConfig.data?.trim()) {
        data = await render(requestConfig.data.trim(), templateVars, { async: true });
        if (headers['Content-Type'] === 'application/json' || headers['content-type'] === 'application/json') {
          data = JSON.parse(data);
        }
      }
    } catch (error) {
      job.set({
        status: JOB_STATUS.REJECTED,
        result: error.message
      });
    }

    try {
      const response = await axios.request({
        url,
        method,
        headers,
        data,
        timeout,
      });
      job.set({
        status: JOB_STATUS.RESOLVED,
        result: response.data
      });
    } catch (error) {
      job.set({
        status: JOB_STATUS.REJECTED,
        result: error.isAxiosError ? error.toJSON() : error.message
      });
    }

    return this.plugin.resume(job);
  };

  async run(node, input, processor) {
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
    });

    setTimeout(() => {
      this.request(node, job, processor);
    });

    return job;
  }

  async resume(node, job, processor) {
    const { ignoreFail } = node.config as RequestConfig;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
