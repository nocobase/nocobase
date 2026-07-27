/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import {
  FlowNodeModel,
  IJob,
  Instruction,
  InstructionResult,
  EXECUTION_STATUS,
  JOB_STATUS,
  JobModel,
  Processor,
  WorkflowModel,
  ExecutionModel,
  WorkflowTimeoutError,
} from '@nocobase/plugin-workflow';
import PluginFileManagerServer, { AttachmentModel } from '@nocobase/plugin-file-manager';
import get from 'lodash/get';

interface Provider {
  port: number;
  host: string;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface MailerInstructionConfig {
  provider: Provider;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  contentType: 'html' | 'text';
  html?: string;
  text?: string;
  ignoreFail?: boolean;
  attachments?: unknown;
}

type FileRecord = AttachmentModel & {
  extname?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function toPlainRecord(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) {
    return null;
  }

  if ('dataValues' in value && isRecord(value.dataValues)) {
    return value.dataValues;
  }

  return value;
}

function isPlainFileRecord(record: unknown): record is FileRecord {
  return Boolean(
    isRecord(record) &&
      typeof record.title === 'string' &&
      typeof record.storageId === 'number' &&
      typeof record.path === 'string' &&
      typeof record.filename === 'string' &&
      record.filename.length > 0,
  );
}

function getAttachmentFilename(file: FileRecord) {
  if (file.title && file.extname) {
    return `${file.title}${file.extname}`;
  }

  return file.title || file.filename;
}

function normalizeFiles(value: unknown): FileRecord[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeFiles(item));
  }

  const record = toPlainRecord(value);
  if (isPlainFileRecord(record)) {
    return [record];
  }

  return [];
}

const transporterMap = new Map<string, Transporter>();
const configMap = new Map<string, any>();

function getTransporterKey(provider: Provider) {
  const { host, port, auth } = provider;
  return `${host}:${port}:${auth?.user}`;
}

function isConfigChanged(oldConfig: any, newConfig: any): boolean {
  const fields = ['host', 'port', 'secure', 'auth.user', 'auth.pass'];
  return fields.some((key) => get(oldConfig, key) !== get(newConfig, key));
}

function createNewTransporter(key: string, config: Provider): Transporter {
  const transporter = nodemailer.createTransport(config);

  transporterMap.set(key, transporter);
  configMap.set(key, config);

  return transporter;
}

function getTransporter(provider: Provider): Transporter {
  const key = getTransporterKey(provider);

  const newConfig = provider;
  const oldConfig = configMap.get(key);

  if (!oldConfig) {
    return createNewTransporter(key, newConfig);
  }

  if (isConfigChanged(oldConfig, newConfig)) {
    const oldTransporter = transporterMap.get(key);

    if (oldTransporter) {
      oldTransporter.close();
    }
    return createNewTransporter(key, newConfig);
  }

  const transporter = transporterMap.get(key);
  if (!transporter) {
    return createNewTransporter(key, newConfig);
  }

  return transporter;
}

function discardTransporter(key: string, transporter: Transporter) {
  transporter.close();
  if (transporterMap.get(key) === transporter) {
    transporterMap.delete(key);
    configMap.delete(key);
  }
}

function createAbortSignal(processor: Processor, signal?: AbortSignal, timeout = 0) {
  const abortController = new AbortController();
  let timeoutTimer: NodeJS.Timeout | null = null;
  let abortListener: (() => void) | null = null;

  const abort = (reason?: any) => {
    if (abortController.signal.aborted) {
      return;
    }
    abortController.abort(reason instanceof Error ? reason : new WorkflowTimeoutError());
  };

  if (signal?.aborted) {
    abort(signal.reason);
  } else {
    abortListener = () => abort(signal?.reason);
    signal?.addEventListener('abort', abortListener, { once: true });
  }

  const executionWorkflow = processor.execution.workflow ?? processor.execution.get?.('workflow');
  const executionWorkflowOptions = executionWorkflow?.options ?? executionWorkflow?.get?.('options') ?? {};
  const workflowTimeout = Number(timeout || executionWorkflowOptions.timeout || 0);
  const expiresAt = processor.execution.expiresAt ?? processor.execution.get?.('expiresAt');
  const startedAt = processor.execution.startedAt ?? processor.execution.get?.('startedAt');
  const remaining = expiresAt
    ? new Date(expiresAt).getTime() - Date.now()
    : workflowTimeout > 0 && startedAt
      ? new Date(startedAt).getTime() + workflowTimeout - Date.now()
      : workflowTimeout > 0
        ? workflowTimeout
        : null;
  if (remaining != null) {
    if (remaining <= 0) {
      abort(new WorkflowTimeoutError());
    } else {
      timeoutTimer = setTimeout(() => abort(new WorkflowTimeoutError()), remaining);
    }
  }

  return {
    signal: abortController.signal,
    cleanup: () => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      if (signal && abortListener) {
        signal.removeEventListener('abort', abortListener);
      }
    },
  };
}

function sendMail(
  transporter: Transporter,
  transporterKey: string,
  payload: Record<string, any>,
  signal?: AbortSignal,
) {
  if (signal?.aborted) {
    discardTransporter(transporterKey, transporter);
    return Promise.reject(signal.reason);
  }

  return new Promise((resolve, reject) => {
    let finished = false;
    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };
    const done = (error: Error | null, result?: any) => {
      if (finished) {
        return;
      }
      finished = true;
      cleanup();
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };
    const onAbort = () => {
      if (finished) {
        return;
      }
      discardTransporter(transporterKey, transporter);
      done(signal?.reason instanceof Error ? signal.reason : new WorkflowTimeoutError());
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      transporter.sendMail(payload, done);
    } catch (error) {
      done(error as Error);
    }
  });
}

export default class MailerInstruction extends Instruction {
  configSchema = Joi.object({
    provider: Joi.object({
      host: Joi.string(),
      port: Joi.alternatives().try(Joi.number().port(), Joi.string()).default(465),
      secure: Joi.alternatives().try(Joi.boolean(), Joi.string()).default(true),
      auth: Joi.object({
        user: Joi.string(),
        pass: Joi.string(),
      }),
    }),
    from: Joi.string(),
    to: Joi.array().items(Joi.string()),
    cc: Joi.array().items(Joi.string()),
    bcc: Joi.array().items(Joi.string()),
    subject: Joi.string(),
    contentType: Joi.string().valid('html', 'text').default('html'),
    html: Joi.string(),
    text: Joi.string(),
    attachments: Joi.any(),
    ignoreFail: Joi.boolean().default(false),
  });

  private async getAttachments(attachments: unknown = []): Promise<Mail.Attachment[] | undefined> {
    const files = normalizeFiles(attachments);

    if (!files.length) {
      return undefined;
    }

    const fileManager = this.workflow.app.pm.get(PluginFileManagerServer) as PluginFileManagerServer | undefined;
    if (!fileManager) {
      throw new Error('[workflow-mailer] file-manager plugin is required to send attachments');
    }

    return Promise.all(
      files.map(async (file) => {
        const { stream, contentType } = await fileManager.getFileStream(file);
        const resolvedContentType = contentType || file.mimetype;

        return {
          filename: getAttachmentFilename(file),
          content: stream,
          ...(resolvedContentType ? { contentType: resolvedContentType } : {}),
        };
      }),
    );
  }

  private async getPayload(config: MailerInstructionConfig) {
    const { provider, contentType, to = [], cc, bcc, subject, html, text, ignoreFail, attachments, ...others } = config;

    return {
      ...others,
      ...(contentType === 'html' ? { html } : { text }),
      subject: subject?.trim(),
      to: to
        ? to
            .flat()
            .map((item) => item?.trim())
            .filter(Boolean)
        : undefined,
      cc: cc
        ? cc
            .flat()
            .map((item) => item?.trim())
            .filter(Boolean)
        : [],
      bcc: bcc
        ? bcc
            .flat()
            .map((item) => item?.trim())
            .filter(Boolean)
        : [],
      attachments: await this.getAttachments(attachments),
    };
  }

  async run(
    node: FlowNodeModel,
    prevJob: JobModel,
    processor: Processor,
    options?: { signal?: AbortSignal },
  ): Promise<InstructionResult> {
    const config: MailerInstructionConfig = processor.getParsedValue(node.config, node.id);
    const { provider, ignoreFail } = config;

    const { workflow } = processor.execution as ExecutionModel & { workflow: WorkflowModel };
    const currentWorkflow = workflow?.options || workflow?.get?.('options') ? workflow : await node.getWorkflow();
    const sync = this.workflow.isWorkflowSync(currentWorkflow);
    const workflowOptions = currentWorkflow?.options ?? currentWorkflow?.get?.('options') ?? {};
    const workflowTimeout = Number(workflowOptions.timeout ?? 0);

    const transporterKey = getTransporterKey(provider);
    const transporter = getTransporter(provider);
    const mailAbort = createAbortSignal(processor, options?.signal, workflowTimeout);

    if (sync) {
      try {
        const payload = await this.getPayload(config);
        const result = await sendMail(transporter, transporterKey, payload, mailAbort.signal);
        return {
          status: JOB_STATUS.RESOLVED,
          result,
        };
      } catch (error: any) {
        if (mailAbort.signal.aborted) {
          throw error;
        }
        return {
          status: ignoreFail ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED,
          result: error,
        };
      } finally {
        mailAbort.cleanup();
      }
    }

    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    await processor.exit();

    const jobDone: IJob = { status: JOB_STATUS.PENDING };

    try {
      const payload = await this.getPayload(config);
      const response = await sendMail(transporter, transporterKey, payload, mailAbort.signal);
      processor.logger.info(`smtp-mailer (#${node.id}) sent successfully.`);
      jobDone.status = JOB_STATUS.RESOLVED;
      jobDone.result = response;
    } catch (error: any) {
      processor.logger.warn(`smtp-mailer (#${node.id}) sent failed: ${error.message}`);

      jobDone.status = mailAbort.signal.aborted ? JOB_STATUS.ABORTED : JOB_STATUS.FAILED;
      jobDone.result = error;
    } finally {
      mailAbort.cleanup();
      processor.logger.debug(`smtp-mailer (#${node.id}) sending ended, resume workflow...`);
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
        processor.logger.warn(
          `smtp-mailer (#${node.id}) result discarded because execution (${execution.id}) is ended`,
        );
      }
    }
  }

  async resume(node: FlowNodeModel, job: JobModel, processor: Processor) {
    const { ignoreFail } = node.config;
    if (ignoreFail && job.status !== JOB_STATUS.ABORTED) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
