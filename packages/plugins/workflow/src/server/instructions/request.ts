import { JOB_STATUS } from '../constants';
import { render } from 'ejs';
import axios, { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { Instruction } from './index';

export interface Header {
  name: string;
  value: any;
}

export type RequestConfig = Pick<AxiosRequestConfig, 'url' | 'method' | 'data' | 'timeout'> & {
  headers: Array<Header>;
  ignoreFail: boolean;
};

async function renderData(templateStr: string, vars: any): Promise<string> {
  if (_.isEmpty(templateStr)) {
    return '';
  }
  return render(templateStr, vars, { async: true });
}

async function triggerResume(plugin, job, status, result) {
  job.set('status', status);
  job.set('result', result);
  return plugin.resume(job);
}

export default class implements Instruction {
  async run(node, input, processor) {
    const templateVars = {
      node: processor.jobsMapByNodeId,
      ctx: processor.execution.context,
    };
    const requestConfig = node.config as RequestConfig;

    // default headers
    const headers = {
      'Content-Type': 'application/json',
    };
    const { headers: headerArr = [], ignoreFail = false, method = 'POST', timeout = 5000 } = requestConfig;
    headerArr.forEach((header) => (headers[header.name] = header.value));

    let url, data;
    try {
      url = await renderData(requestConfig.url, templateVars);
    } catch (e) {
      console.warn(e);
      throw new Error(`ejs can't render url, please check url format！${(e as Error)?.message}`);
    }
    try {
      data = await renderData(requestConfig.data, templateVars);
    } catch (e) {
      console.warn(e);
      throw new Error(`ejs can't render request data, please check request data format！${(e as Error)?.message}`);
    }

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
    });

    const plugin = processor.options.plugin;
    axios
      .request({
        method,
        timeout,
        headers,
        url,
        data,
      })
      .then((resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          triggerResume(plugin, job, JOB_STATUS.RESOLVED, resp.data);
        } else {
          triggerResume(plugin, job, JOB_STATUS.REJECTED, resp);
        }
      })
      .catch((e) => {
        console.warn(e);
        triggerResume(plugin, job, JOB_STATUS.REJECTED, (e as Error)?.message);
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
