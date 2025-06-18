/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import axios, { AxiosRequestConfig } from 'axios';
import { trim } from 'lodash';

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';
import PluginFileManagerServer, { AttachmentModel } from '@nocobase/plugin-file-manager';
import { Application } from '@nocobase/server';
import { Readable } from 'stream';

export interface Header {
  name: string;
  value: string;
}

export type RequestInstructionConfig = Pick<AxiosRequestConfig, 'url' | 'method' | 'params' | 'data' | 'timeout'> & {
  headers?: Header[];
  contentType: string;
  ignoreFail?: boolean;
  onlyData?: boolean;
};

interface MultipartTextField {
  valueType: 'text';
  name: string;
  text: string;
}

interface MultipartFileField {
  valueType: 'file';
  name: string;
  file: AttachmentModel;
}

async function request(config: RequestInstructionConfig, app: Application) {
  // default headers
  const { url, method = 'POST', contentType = 'application/json', data, timeout = 5000 } = config;
  const headers = (config.headers ?? []).reduce((result, header) => {
    const name = trim(header.name);
    if (name.toLowerCase() === 'content-type') {
      return result;
    }
    return Object.assign(result, { [name]: trim(header.value) });
  }, {});
  const params = (config.params ?? []).reduce(
    (result, param) => Object.assign(result, { [param.name]: trim(param.value) }),
    {},
  );

  // TODO(feat): only support JSON type for now, should support others in future
  if (contentType !== 'multipart/form-data') {
    headers['Content-Type'] = contentType;
  }

  const ContentTypeTransformers = {
    'text/plain'(data) {
      return data.toString();
    },
    'application/x-www-form-urlencoded'(data: { name: string; value: string }[]) {
      return new URLSearchParams(
        data.filter(({ name, value }) => name && typeof value !== 'undefined').map(({ name, value }) => [name, value]),
      ).toString();
    },
    async 'multipart/form-data'(data: (MultipartTextField | MultipartFileField)[]) {
      const form = new FormData();

      for (const record of data) {
        if (record.valueType === 'text') {
          form.append(record.name, record.text);
          continue;
        }

        if (record.valueType === 'file') {
          const plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
          const { stream, contentType } = await plugin.getFileStream(record.file);

          const chunks = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }

          form.append(record.name, new Blob(chunks, { type: contentType }), record.file.filename);
          continue;
        }

        console.error('Invalid value type');
      }

      return form;
    },
  };

  const transformer = ContentTypeTransformers[contentType];

  return axios.request({
    url: trim(url),
    method,
    headers,
    params,
    timeout,
    ...(method.toLowerCase() !== 'get' && data != null
      ? {
          data: transformer ? await transformer(data) : data,
        }
      : {}),
  });
}

function responseSuccess(response, onlyData = false) {
  return onlyData
    ? response.data
    : {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config,
        data: response.data,
      };
}

function responseFailure(error) {
  let result = {
    message: error.message,
    stack: error.stack,
  };
  if (error.isAxiosError) {
    if (error.response) {
      Object.assign(result, {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        config: error.response.config,
        data: error.response.data,
      });
    } else if (error.request) {
      result = error.toJSON();
    }
  }
  return result;
}

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const config = processor.getParsedValue(node.config, node.id) as RequestInstructionConfig;

    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    if (sync) {
      try {
        const response = await request(config, this.workflow.app);
        return {
          status: JOB_STATUS.RESOLVED,
          result: responseSuccess(response, config.onlyData),
        };
      } catch (error) {
        return {
          status: config.ignoreFail ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED,
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
    request(config, this.workflow.app)
      .then((response) => {
        processor.logger.info(`request (#${node.id}) response success, status: ${response.status}`);

        job.set({
          status: JOB_STATUS.RESOLVED,
          result: responseSuccess(response, config.onlyData),
        });
      })
      .catch((error) => {
        if (error.isAxiosError) {
          if (error.response) {
            processor.logger.info(`request (#${node.id}) failed with response, status: ${error.response.status}`);
          } else if (error.request) {
            processor.logger.error(`request (#${node.id}) failed without resposne: ${error.message}`);
          } else {
            processor.logger.error(`request (#${node.id}) initiation failed: ${error.message}`);
          }
        } else {
          processor.logger.error(`request (#${node.id}) failed unexpectedly: ${error.message}`);
        }

        job.set({
          status: JOB_STATUS.FAILED,
          result: responseFailure(error),
        });
      })
      .finally(() => {
        processor.logger.debug(`request (#${node.id}) ended, resume workflow...`);
        setTimeout(() => {
          job.execution = processor.execution;
          this.workflow.resume(job);
        });
      });

    processor.logger.info(`request (#${node.id}) sent to "${config.url}", waiting for response...`);

    return null;
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    const { ignoreFail } = node.config as RequestInstructionConfig;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }

  async test(config: RequestInstructionConfig) {
    try {
      const response = await request(config, this.workflow.app);
      return {
        status: JOB_STATUS.RESOLVED,
        result: responseSuccess(response, config.onlyData),
      };
    } catch (error) {
      return {
        status: config.ignoreFail ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED,
        result: error.isAxiosError ? error.toJSON() : error.message,
      };
    }
  }
}
