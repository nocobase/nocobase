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
    notificationServer.send(options);

    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
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
