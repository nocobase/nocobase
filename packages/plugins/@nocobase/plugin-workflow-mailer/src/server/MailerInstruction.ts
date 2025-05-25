/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promisify } from 'util';

import nodemailer from 'nodemailer';

import { FlowNodeModel, Instruction, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const {
      provider,
      contentType,
      to = [],
      cc,
      bcc,
      subject,
      html,
      text,
      ignoreFail,
      ...options
    } = processor.getParsedValue(node.config, node.id);

    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    const transporter = nodemailer.createTransport(provider);
    const send = promisify(transporter.sendMail.bind(transporter));

    const payload = {
      ...options,
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
        : null,
      bcc: bcc
        ? bcc
            .flat()
            .map((item) => item?.trim())
            .filter(Boolean)
        : null,
    };

    if (sync) {
      try {
        const result = await send(payload);
        return {
          status: JOB_STATUS.RESOLVED,
          result,
        };
      } catch (error) {
        return {
          status: ignoreFail ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED,
          result: error,
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
    send(payload)
      .then((response) => {
        processor.logger.info(`smtp-mailer (#${node.id}) sent successfully.`);

        job.set({
          status: JOB_STATUS.RESOLVED,
          result: response,
        });
      })
      .catch((error) => {
        processor.logger.warn(`smtp-mailer (#${node.id}) sent failed: ${error.message}`);

        job.set({
          status: JOB_STATUS.FAILED,
          result: error,
        });
      })
      .finally(() => {
        processor.logger.debug(`smtp-mailer (#${node.id}) sending ended, resume workflow...`);
        setImmediate(() => {
          this.workflow.resume(job);
        });
      });

    processor.logger.info(`smtp-mailer (#${node.id}) sent, waiting for response...`);

    return processor.exit();
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    const { ignoreFail } = node.config;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
