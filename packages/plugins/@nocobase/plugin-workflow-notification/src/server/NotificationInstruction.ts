/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import NotificationsServerPlugin from '@nocobase/plugin-notification-manager';

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { ignoreFail, ...config } = node.config;
    const options = processor.getParsedValue(config, node.id);
    const scope = processor.getScope(node.id);
    const sendParams = {
      channelName: options.channelName,
      message: { ...options, content: config.content },
      triggerFrom: 'workflow',
      data: scope,
    };
    const notificationServer = this.workflow.pm.get(NotificationsServerPlugin) as NotificationsServerPlugin;

    try {
      processor.logger.info(`notification (#${node.id}) queued for delivery.`);
      const result = await notificationServer.send({
        ...sendParams,
        transaction: processor.mainTransaction,
      });
      return {
        status: result.status === 'success' || ignoreFail ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED,
        result,
      };
    } catch (error) {
      processor.logger.warn(`notification (#${node.id}) queue failed: ${error.message}`);
      return {
        status: ignoreFail ? JOB_STATUS.RESOLVED : JOB_STATUS.ERROR,
        result: error,
      };
    }
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    return job;
  }

  async test(config) {
    const sendParams = {
      channelName: config.channelName,
      message: config,
      triggerFrom: 'workflow',
      data: {},
    };
    const notificationServer = this.workflow.pm.get(NotificationsServerPlugin) as NotificationsServerPlugin;
    try {
      const result = await notificationServer.sendNow(sendParams);
      if (result.status === 'success') {
        return {
          status: JOB_STATUS.RESOLVED,
          result,
        };
      } else {
        return {
          status: JOB_STATUS.FAILED,
          result,
        };
      }
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error,
      };
    }
  }
}
