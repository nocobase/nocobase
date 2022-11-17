import { JOB_STATUS } from '../constants';
import { render } from 'ejs';
import axios, { AxiosResponse } from 'axios';
import _ from 'lodash';
import Processor from '../Processor';

export interface Header {
  name: string;
  value: any;
}

export interface IRequestConfig {
  requestUrl: string;
  httpMethod: 'GET' | 'POST';
  headers: Array<Header>;
  getMethodParam?: any;
  postMethodData?: string;
}

async function renderData(templateStr: string, vars: any): Promise<string> {
  return render(templateStr, vars, { async: true });
}

export default {
  async run(node, input, processor: Processor) {
    const templateVars = {
      result: _.isEmpty(input?.result) ? '' : input.result,
      node: processor.jobsMapByNodeId,
      ctx: processor.execution.context,
    };
    const requestConfig = node.config as IRequestConfig;

    // default headers
    const headers = {
      'Content-Type': 'application/json',
    };
    const { headers: headerArr = [],httpMethod = 'POST' } = requestConfig;
    headerArr.forEach((header) => (headers[header.name] = header.value));

    let resp: AxiosResponse;
    switch (httpMethod) {
      case 'GET':
        let paramTmplStr = requestConfig.getMethodParam;
        if (_.isObject(paramTmplStr)) {
          paramTmplStr = JSON.stringify(paramTmplStr);
        }
        let params = {};
        if (!_.isEmpty(paramTmplStr)) {
          try {
            const paramStr = await renderData(paramTmplStr, templateVars);
            params = JSON.parse(paramStr);
          } catch (e) {
            console.warn(e)
            throw new Error(`please check GET method request param format！${(e as Error)?.message}`);
          }
        }
        resp = await axios.get(requestConfig.requestUrl, {
          params,
          headers,
        });
        break;
      case 'POST':
        let actualReqData = '';
        if (!_.isEmpty(requestConfig.postMethodData)) {
          try {
            actualReqData = await renderData(requestConfig.postMethodData, templateVars);
          } catch (e) {
            console.warn(e)
            throw new Error(`please check POST method request data format！${(e as Error)?.message}`);
          }
        }
        resp = await axios.post(requestConfig.requestUrl, actualReqData, { headers });
        break;
    }

    return {
      status: JOB_STATUS.RESOLVED,
      result: { status: resp.status, data: resp.data },
    };
  },
};
