/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

/**
 * Generate a NocoBase auth token for a given user.
 * Uses the same mechanism as API Keys plugin: JWT with userId, roleName, and expiresIn.
 * The token can be used for SSO / passwordless login by appending ?token=xxx to a URL.
 */
export default class SignTokenInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const userId = processor.getParsedValue(node.config.userId, node.id);
    const roleName = processor.getParsedValue(node.config.roleName, node.id) || undefined;
    const expiresIn = node.config.expiresIn || '1d';

    if (!userId) {
      return { result: { error: 'userId is required' }, status: JOB_STATUS.ERROR };
    }

    try {
      const app = this.workflow.app;

      // Verify user exists
      const userRepo = app.db.getRepository('users');
      const user = await userRepo.findOne({ filterByTk: userId });
      if (!user) {
        return { result: { error: `User ${userId} not found` }, status: JOB_STATUS.ERROR };
      }

      // If roleName specified, verify user has that role
      if (roleName) {
        const rolesRepo = app.db.getRepository('users.roles', userId);
        const role = await rolesRepo.findOne({ filter: { name: roleName } });
        if (!role) {
          return { result: { error: `User ${userId} does not have role "${roleName}"` }, status: JOB_STATUS.ERROR };
        }
      }

      // Sign token using the same approach as API Keys plugin
      const payload: any = { userId: user.id };
      if (roleName) {
        payload.roleName = roleName;
      }
      const token = app.authManager.jwt.sign(payload, { expiresIn });

      return {
        result: { token, userId: user.id, roleName: roleName || null, expiresIn },
        status: JOB_STATUS.RESOLVED,
      };
    } catch (err) {
      return {
        result: { error: err.message },
        status: JOB_STATUS.ERROR,
      };
    }
  }
}
