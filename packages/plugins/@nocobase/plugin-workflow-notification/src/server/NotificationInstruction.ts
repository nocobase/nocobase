/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import NotificationsServerPlugin, { SendFnType, NotificationServerBase } from '@nocobase/plugin-notification-manager';

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const options = processor.getParsedValue(node.config, node.id);
    const notificationServer = this.workflow.pm.get(NotificationsServerPlugin) as NotificationsServerPlugin;

    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);
    if (sync) {
      try {
        const result = await notificationServer.send({ ...options, triggerFrom: 'workflow' });
        return {
          status: JOB_STATUS.RESOLVED,
          result,
        };
      } catch (error) {
        return {
          status: JOB_STATUS.FAILED,
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
    notificationServer
      .send({ ...options, triggerFrom: 'workflow' })
      .then((res) => {
        processor.logger.info(`smtp-mailer (#${node.id}) sent successfully.`);

        job.set({
          status: JOB_STATUS.RESOLVED,
          result: res,
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
    processor.logger.info(`notification (#${node.id}) sent, waiting for response...`);

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
