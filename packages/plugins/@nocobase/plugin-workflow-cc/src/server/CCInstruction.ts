/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isValidFilter, uid } from '@nocobase/utils';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';
import { TASK_STATUS } from '../common/constants';

async function getUsers(config, { db, transaction }): Promise<number[]> {
  const users: Set<number> = new Set();
  const UserRepo = db.getRepository('users');
  for (const item of config) {
    if (typeof item === 'object') {
      if (!isValidFilter(item.filter)) {
        continue;
      }
      const result = await UserRepo.find({
        ...item,
        fields: ['id'],
        transaction,
      });
      result.forEach((item) => users.add(item.id));
    } else {
      users.add(item);
    }
  }

  return [...users];
}

export default class CCInstruction extends Instruction {
  static type = 'cc';

  async run(node, prevJob, processor) {
    const { db } = processor.options.plugin;
    const job = processor.saveJob({
      status: JOB_STATUS.RESOLVED,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });
    const usersConfig = processor
      .getParsedValue(node.config.users ?? [], node.id)
      .flat()
      .filter(Boolean);
    const users = await getUsers(usersConfig, { db, transaction: processor.mainTransaction });

    const RecordRepo = db.getRepository('workflowCcTasks');
    const title = node.config.title ? processor.getParsedValue(node.config.title, node.id) : node.title;
    const records = await RecordRepo.createMany({
      records: users.map((userId, index) => ({
        userId,
        jobId: job.id,
        nodeId: node.id,
        executionId: job.executionId,
        workflowId: node.workflowId,
        status: TASK_STATUS.UNREAD,
        title,
      })),
      transaction: processor.mainTransaction,
    });

    // const { notifications = [] } = node.config;
    // if (notifications.length) {
    //   records
    //     .filter((record) => record.status === TASK_STATUS.UNREAD)
    //     .forEach((record) => {
    //       this.notify(record, context, node, processor);
    //     });
    // }

    return job;
  }

  async duplicateConfig(node, { transaction }) {
    const uiSchemaRepo = this.workflow.app.db.getRepository('uiSchemas') as UiSchemaRepository;
    if (!node.config.ccDetail) {
      return node.config;
    }
    const result = await uiSchemaRepo.duplicate(node.config.ccDetail, {
      transaction,
    });

    return {
      ...node.config,
      ccDetail: result?.['x-uid'] ?? uid(),
    };
  }
}
