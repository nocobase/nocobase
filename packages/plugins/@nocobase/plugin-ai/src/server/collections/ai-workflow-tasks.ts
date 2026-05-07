/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  migrationRules: ['schema-only'],
  autoGenId: false,
  name: 'aiWorkflowTasks',
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'workflowTitle',
      type: 'string',
      allowNull: false,
    },
    {
      name: 'nodeTitle',
      type: 'string',
      allowNull: false,
    },
    {
      name: 'requiresApproval', // no_required, ai_decision, human_decision
      type: 'string',
      allowNull: true,
    },
    {
      name: 'status', // processing; pending_acceptance; pending_approval; approved; rejected; aborted;
      type: 'string',
      allowNull: false,
    },
    {
      name: 'acceptedUserId',
      type: 'bigInt',
      allowNull: true,
    },
    {
      name: 'sessionId',
      type: 'uuid',
      unique: true,
      allowNull: false,
    },
    {
      name: 'messageId',
      type: 'uuid',
      allowNull: true,
    },
    {
      name: 'jobId',
      type: 'snowflakeId',
      unique: true,
      allowNull: false,
    },
    {
      name: 'executionId',
      type: 'snowflakeId',
      allowNull: false,
    },
    {
      name: 'nodeId',
      type: 'snowflakeId',
      allowNull: false,
    },
    {
      name: 'workflowId',
      type: 'snowflakeId',
      allowNull: false,
    },
    {
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      foreignKey: 'aiWorkflowTaskId',
      otherKey: 'userId',
      through: 'usersAiWorkflowTasks',
    },
  ],
});
