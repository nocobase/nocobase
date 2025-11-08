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

import { FlowNodeModel, IJob, Instruction, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';

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

    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    await processor.exit();

    const jobDone: IJob = { status: JOB_STATUS.PENDING };

    try {
      const response = await send(payload);
      processor.logger.info(`smtp-mailer (#${node.id}) sent successfully.`);
      jobDone.status = JOB_STATUS.RESOLVED;
      jobDone.result = response;
    } catch (error) {
      processor.logger.warn(`smtp-mailer (#${node.id}) sent failed: ${error.message}`);

      jobDone.status = JOB_STATUS.FAILED;
      jobDone.result = error;
    } finally {
      processor.logger.debug(`smtp-mailer (#${node.id}) sending ended, resume workflow...`);
      // At this point, the job is guaranteed to be in the database.
      const job = await this.workflow.app.db.getRepository('jobs').findOne({
        filterByTk: id,
      });

      job.set(jobDone);
      this.workflow.resume(job);
    }
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    const { ignoreFail } = node.config;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
