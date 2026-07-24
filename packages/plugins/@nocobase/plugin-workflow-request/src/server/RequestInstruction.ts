/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import { AxiosRequestConfig } from 'axios';
import { trim } from 'lodash';

import {
  Processor,
  Instruction,
  JOB_STATUS,
  FlowNodeModel,
  IJob,
  JobModel,
  EXECUTION_STATUS,
} from '@nocobase/plugin-workflow';
import PluginFileManagerServer, { AttachmentModel } from '@nocobase/plugin-file-manager';
import { Application } from '@nocobase/server';
import { Readable } from 'stream';
import { serverRequest } from '@nocobase/utils';

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
  file: AttachmentModel | AttachmentModel[];
}

interface RequestError extends Error {
  isAxiosError?: boolean;
  response?: {
    status: number;
    statusText?: string;
    data?: unknown;
  };
  request?: unknown;
  code?: string;
}

function toRequestError(error: unknown): RequestError {
  return error instanceof Error ? (error as RequestError) : new Error(String(error));
}

function getContentTypeTransformer(mimeType: string, app: Application) {
  switch (mimeType) {
    case 'text/plain':
      return function (data) {
        return data.toString();
      };
    case 'application/x-www-form-urlencoded':
      return function (data: { name: string; value: string }[]) {
        return new URLSearchParams(
          data
            .filter(({ name, value }) => name && typeof value !== 'undefined')
            .map(({ name, value }) => [name, value]),
        ).toString();
      };
    case 'multipart/form-data':
      return async function (data: (MultipartTextField | MultipartFileField)[]) {
        const form = new FormData();

        for (const record of data) {
          if (record.valueType === 'text') {
            form.append(record.name, record.text);
            continue;
          }

          if (record.valueType === 'file') {
            if (record.file == null) {
              continue;
            }

            const plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
            const files: AttachmentModel[] = Array.isArray(record.file) ? record.file : [record.file];

            for (const file of files) {
              const { stream, contentType } = await plugin.getFileStream(file);

              const chunks = [];
              for await (const chunk of stream) {
                chunks.push(chunk);
              }

              form.append(record.name, new Blob(chunks, { type: contentType }), file.filename);
            }

            continue;
          }

          throw new Error(`Invalid value type: ${JSON.stringify(record)}`);
        }

        return form;
      };
  }
}

function createInvalidUrlError(cause?: unknown) {
  if (cause instanceof TypeError && typeof (cause as any).code !== 'undefined') {
    return cause;
  }

  const error = new TypeError('Invalid URL') as TypeError & { code?: string };
  error.code = 'ERR_INVALID_URL';
  return error;
}

function validateUrl(url?: string) {
  if (!url) {
    throw createInvalidUrlError();
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw createInvalidUrlError();
    }
  } catch (error) {
    throw createInvalidUrlError(error);
  }
}

async function request(config: RequestInstructionConfig, app: Application, signal?: AbortSignal) {
  // default headers
  const { url, method = 'POST', contentType = 'application/json', data, timeout = 5000 } = config;

  validateUrl(url);
  const headers: Record<string, string> = (config.headers ?? []).reduce((result, header) => {
    const name = trim(header.name);
    if (name.toLowerCase() === 'content-type') {
      return result;
    }
    return Object.assign(result, { [name]: trim(header.value) });
  }, {});
  const params: Record<string, any> = (config.params ?? []).reduce(
    (result: Record<string, any>, param: { name: string; value: string }) =>
      Object.assign(result, { [param.name]: trim(param.value) }),
    {},
  );

  // TODO(feat): only support JSON type for now, should support others in future
  if (contentType !== 'multipart/form-data') {
    headers['Content-Type'] = contentType;
  }

  const transformer = getContentTypeTransformer(contentType, app);
  return serverRequest({
    url: trim(url),
    method,
    headers,
    params,
    timeout,
    signal,
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
        data: response.data,
      };
}

function responseFailure(error) {
  const result: Record<string, any> = {
    message: error instanceof Error ? error.message : String(error),
  };

  if (typeof error?.code !== 'undefined') {
    result['code'] = error.code;
  }

  if (error?.isAxiosError && error.response) {
    Object.assign(result, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
    });
  }

  return result;
}

function failureStatus(config: RequestInstructionConfig, error) {
  if (config.ignoreFail) {
    return JOB_STATUS.RESOLVED;
  }

  return error?.code === 'ECONNABORTED' ? JOB_STATUS.ABORTED : JOB_STATUS.FAILED;
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'application/xml',
  'text/plain',
];

function logFailureDebug(logger, error) {
  if (!error?.isAxiosError) {
    return;
  }

  if (error.response) {
    logger.debug('request failed response details', {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
    });
    return;
  }

  logger.debug('request failed error details', responseFailure(error));
}

export default class extends Instruction {
  configSchema = Joi.object({
    url: Joi.string(),
    method: Joi.string().valid(...METHODS),
    contentType: Joi.string().valid(...CONTENT_TYPES),
    headers: Joi.array().items(
      Joi.object({
        name: Joi.string(),
        value: Joi.string(),
      }),
    ),
    params: Joi.array().items(
      Joi.object({
        name: Joi.string(),
        value: Joi.string(),
      }),
    ),
    data: Joi.alternatives().try(Joi.object(), Joi.array(), Joi.string()),
    timeout: Joi.number().integer().positive().default(5000),
    ignoreFail: Joi.boolean().default(false),
    onlyData: Joi.boolean().default(false),
  });

  async run(node: FlowNodeModel, prevJob: JobModel, processor: Processor, options?: { signal?: AbortSignal }) {
    const config = processor.getParsedValue(node.config, node.id) as RequestInstructionConfig;

    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    if (sync) {
      try {
        const response = await request(config, this.workflow.app, options?.signal);
        return {
          status: JOB_STATUS.RESOLVED,
          result: responseSuccess(response, config.onlyData),
        };
      } catch (error) {
        logFailureDebug(this.workflow.app.logger, error);
        return {
          status: failureStatus(config, error),
          result: responseFailure(error),
        };
      }
    }

    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    await processor.exit();
    const abortHandle = processor.createBackgroundAbortHandle();

    const jobDone: IJob = { status: JOB_STATUS.PENDING };
    const settleRequest = async () => {
      try {
        processor.logger.info(`request (#${node.id}) sent to "${config.url}", waiting for response...`);
        const response = await request(config, this.workflow.app, abortHandle.signal);
        processor.logger.info(`request (#${node.id}) response success, status: ${response.status}`);
        jobDone.status = JOB_STATUS.RESOLVED;
        jobDone.result = responseSuccess(response, config.onlyData);
      } catch (caught) {
        const error = toRequestError(caught);
        if (error.isAxiosError) {
          if (error.response) {
            processor.logger.info(`request (#${node.id}) failed with response, status: ${error.response.status}`);
          } else if (error.request) {
            processor.logger.error(`request (#${node.id}) failed without response: ${error.message}`);
          } else {
            processor.logger.error(`request (#${node.id}) initiation failed: ${error.message}`);
          }
        } else {
          processor.logger.error(`request (#${node.id}) failed unexpectedly: ${error.message}`);
        }
        logFailureDebug(processor.logger, error);
        jobDone.status = abortHandle.signal.aborted ? JOB_STATUS.ABORTED : failureStatus(config, error);
        jobDone.result = responseFailure(error);
      } finally {
        abortHandle.dispose();
        // At this point, the job is guaranteed to be in the database.
        const job = await this.workflow.app.db.getRepository('jobs').findOne({
          filterByTk: id,
        });
        const execution = await job.getExecution();
        const aborted = await this.workflow.abortExecutionIfExpired(execution);
        if (!aborted) {
          await execution.reload();
          await job.reload();
        }
        if (!aborted && execution.status === EXECUTION_STATUS.STARTED && job.status === JOB_STATUS.PENDING) {
          job.set(jobDone);
          await this.workflow.resume(job);
        } else {
          processor.logger.warn(`request (#${node.id}) result discarded because execution (${execution.id}) is ended`);
        }
      }
    };

    settleRequest().catch((caught) => {
      const error = toRequestError(caught);
      processor.logger.error(`request (#${node.id}) async settling failed: ${error.message}`, { error });
    });
  }

  async resume(node: FlowNodeModel, job: JobModel, processor: Processor) {
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
      logFailureDebug(this.workflow.app.logger, error);
      return {
        status: failureStatus(config, error),
        result: responseFailure(error),
      };
    }
  }
}
