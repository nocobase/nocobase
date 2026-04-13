/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowNodeModel,
  Instruction,
  InstructionResult,
  JOB_STATUS,
  JobModel,
  Processor,
} from '@nocobase/plugin-workflow';
import _ from 'lodash';
import PluginAIServer from '../../../plugin';
import { AIEmployee } from '../../../ai-employees/ai-employee';
import { Model, Transactionable } from '@nocobase/database';
import { AIEmployeeInstructionConfig } from './types';
import { Files } from './files';
import { isValidFilter } from '@nocobase/utils';

export class AIEmployeeInstruction extends Instruction {
  run(node: FlowNodeModel, input: any, processor: Processor): InstructionResult {
    const {
      username,
      message,
      skillSettings,
      webSearch,
      model,
      requiresApproval = 'no_required',
      userId,
      files,
    }: AIEmployeeInstructionConfig = processor.getParsedValue(node.config, node.id);

    const toolName = 'aiEmployeeWorkflowTaskOutput';
    const systemMessage = `You are invoked by workflow, after done your job, call tool **${toolName}**\n\n${
      typeof message.system === 'object' ? JSON.stringify(message.system) : message.system
    }`;
    const userMessage = typeof message.user === 'object' ? JSON.stringify(message.user) : message.user;

    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: input?.id ?? null,
    });

    const runner = async () => {
      const { conversation, aiWorkflowTasks } = await this.createWorkflowTask({
        username,
        userMessage,
        systemMessage,
        skillSettings,
        requiresApproval,
        toolName,
        node,
        processor,
        job,
      });

      let currentRoles = input?.result?.roleName;
      if (!currentRoles) {
        const defaultRole = await this.workflow.db.getRepository('rolesUsers').findOne({
          filter: {
            userId: input?.result?.user?.id ?? userId,
            default: true,
          },
        });
        currentRoles = defaultRole?.roleName;
      }

      const employee = await this.workflow.db.getRepository('aiEmployees').findOne({
        filter: {
          username,
        },
      });

      const aiEmployee = new AIEmployee({
        ctx: {
          app: this.workflow.app,
          db: this.workflow.app.db,
          log: this.workflow.app.log,
          logger: this.workflow.app.log,
          state: { currentRoles },
        } as any,
        employee,
        sessionId: conversation.sessionId,
        systemMessage,
        skillSettings,
        webSearch,
        model,
        tools: [{ name: toolName }],
      });

      const attachmentPart: Record<string, any> = {};
      if (files?.length) {
        const { resolveAttachments, resolveUrls } = Files.resolvers(this.workflow, job, attachmentPart);
        await resolveAttachments(files);
        await resolveUrls(files);
      }

      const result = await aiEmployee.invoke({
        userMessages: [
          {
            role: 'user',
            content: {
              type: 'text',
              content: userMessage,
            },
            ...attachmentPart,
          },
        ],
      });

      await this.checkApproval({ requiresApproval, conversation, aiWorkflowTasks, result, aiEmployee, toolName });
    };

    runner().catch((e) => {
      processor.logger.error(`llm invoke failed, ${e.message}`, {
        node: node.id,
        stack: e.stack,
        chatOptions: node.config,
      });
      job.set({
        status: JOB_STATUS.ERROR,
        result: e.message,
      });
    });

    processor.exit();
    return job;
  }

  resume(node: FlowNodeModel, job: any, processor: Processor) {
    return job;
  }

  private async createWorkflowTask({
    username,
    userMessage,
    systemMessage,
    skillSettings,
    requiresApproval,
    toolName,
    node,
    processor,
    job,
  }: {
    username: string;
    userMessage: string;
    systemMessage: string;
    skillSettings: AIEmployeeInstructionConfig['skillSettings'];
    requiresApproval: 'no_required' | 'ai_decision' | 'human_decision';
    toolName: string;
    node: FlowNodeModel;
    processor: Processor;
    job: JobModel;
  }) {
    const ai = this.workflow.app.pm.get(PluginAIServer);
    return await this.workflow.db.sequelize.transaction(async (transaction) => {
      const conversation = await ai.aiConversationsManager.create({
        aiEmployee: {
          username,
        },
        title: userMessage.slice(0, 30),
        from: 'sub-agent',
        options: {
          systemMessage,
          skillSettings,
          tools: [{ name: toolName }],
        },
        transaction,
      });

      const aiWorkflowTasks = await this.workflow.db.getRepository('aiWorkflowTasks').create({
        values: {
          id: this.workflow.app.snowflakeIdGenerator.generate(),
          workflowTitle: processor.execution.workflow?.title,
          nodeTitle: node.title,
          requiresApproval,
          status: 'processing',
          sessionId: conversation.sessionId,
          jobId: job.id,
          executionId: processor.execution.id,
          nodeId: job.nodeId,
          workflowId: node.workflowId,
        },
        transaction,
      });

      if (requiresApproval !== 'no_required') {
        const userIds = await parseAssignees(node, processor);
        if (userIds?.length) {
          await this.workflow.db.getRepository('usersAiWorkflowTasks').create({
            values: userIds.map((userId) => ({
              userId,
              aiWorkflowTaskId: aiWorkflowTasks.id,
              read: true,
            })),
            transaction,
          });
        }
      }

      return { conversation, aiWorkflowTasks };
    });
  }

  private async checkApproval({
    requiresApproval,
    conversation,
    aiWorkflowTasks,
    result,
    aiEmployee,
    toolName,
  }: {
    requiresApproval: 'no_required' | 'ai_decision' | 'human_decision';
    conversation: any;
    aiWorkflowTasks: any;
    result: any;
    aiEmployee: AIEmployee;
    toolName: string;
  }) {
    const ai = this.workflow.app.pm.get(PluginAIServer);
    const aiToolMessage = await this.workflow.db.getRepository('aiToolMessages').findOne({
      filter: {
        sessionId: conversation.sessionId,
        messageId: result.messageId,
      },
    });
    if (aiToolMessage?.invokeStatus !== 'interrupted') {
      return;
    }
    const aiMessage = await this.workflow.db.getRepository('aiMessages').findOne({
      filter: {
        messageId: result.messageId,
      },
    });
    const toolCalls = aiMessage?.toolCalls;
    if (!toolCalls?.length) {
      return;
    }
    const toolCall = toolCalls.find((it: any) => it.name === toolName);
    if (toolCall?.args?.requiresApproval === false) {
      const [updated] = await this.workflow.db.getModel('aiToolMessages').update(
        { userDecision: { type: 'approve' }, invokeStatus: 'waiting' },
        {
          where: {
            sessionId: conversation.sessionId,
            messageId: result.messageId,
            invokeStatus: 'interrupted',
          },
        },
      );
      if (!updated) {
        return;
      }
      const userDecisions = await ai.aiConversationsManager.getUserDecisions(result.messageId);
      await aiEmployee.invoke({ userDecisions });
      await this.workflow.db.getRepository('aiWorkflowTasks').update({
        values: { status: 'approved' },
        filter: {
          id: aiWorkflowTasks.id,
        },
      });
    } else if (requiresApproval !== 'no_required') {
      await this.workflow.db.getRepository('aiWorkflowTasks').update({
        values: { status: 'pending_acceptance' },
        filter: {
          id: aiWorkflowTasks.id,
        },
      });
    }
  }
}

async function parseAssignees(node, processor): Promise<number[]> {
  const configAssignees = processor
    .getParsedValue(node.config.assignees ?? [], node.id)
    .flat()
    .filter(Boolean);

  const assignees: number[] = [];
  const seen = new Set<number>();

  const addAssignee = (id: number) => {
    if (!seen.has(id)) {
      seen.add(id);
      assignees.push(id);
    }
  };

  const UserRepo = processor.options.plugin.app.db.getRepository('users');

  // Batch-validate all plain user IDs upfront in a single DB query.
  // This avoids blindly trusting user input and prevents records with non-existent userIds.
  // Note: after flat(), an item may still be an array when the resolved variable is itself an array;
  // those array items are also treated as plain IDs and included in the batch validation.
  const plainIds = configAssignees.flatMap((item) =>
    Array.isArray(item) ? item : typeof item !== 'object' ? [item] : [],
  ) as number[];
  const validIdSet = new Set<number>();
  if (plainIds.length) {
    const users = await UserRepo.find({
      filter: { id: { $in: plainIds } },
      fields: ['id'],
      transaction: processor.mainTransaction,
    });
    users.forEach((u) => validIdSet.add(u.id));
  }

  for (const item of configAssignees) {
    if (Array.isArray(item)) {
      // Array of plain IDs (e.g. from a variable resolving to an array) — preserve their order.
      for (const id of item) {
        if (validIdSet.has(id)) {
          addAssignee(id);
        }
      }
    } else if (typeof item === 'object') {
      if (!isValidFilter(item.filter)) {
        continue;
      }
      // For filter objects: query as-is and use DB-returned order.
      // Intra-group ordering will be supported via an explicit sort config option in the future.
      const result = await UserRepo.find({
        ...item,
        fields: ['id'],
        transaction: processor.mainTransaction,
      });
      result.forEach((user) => addAssignee(user.id));
    } else {
      // For plain IDs: only add if validated (exists in DB), preserving config order.
      if (validIdSet.has(item)) {
        addAssignee(item);
      }
    }
  }

  return assignees;
}

export const registerAIEmployeeTaskNotification = (plugin: PluginAIServer) => {
  plugin.db.on('aiWorkflowTasks.beforeSave', async (model: Model, options: Transactionable) => {
    if (!model.isNewRecord && !model.changed('status')) {
      return;
    }
    const values = model.toJSON();
    if (values.status !== 'pending_acceptance') {
      return;
    }
    options.transaction?.afterCommit(async () => {
      const assignees = await plugin.db.getRepository('usersAiWorkflowTasks').find({
        filter: {
          aiWorkflowTaskId: values.id,
        },
      });
      if (!assignees?.length) {
        return;
      }

      await plugin.db.getRepository('usersAiWorkflowTasks').update({
        values: {
          read: false,
        },
        filter: {
          aiWorkflowTaskId: values.id,
        },
      });

      for (const assignee of assignees) {
        plugin.app.emit('ws:sendToUser', {
          userId: assignee.userId,
          message: {
            type: 'ai-employee-tasks:status',
            payload: {
              taskId: values.id,
              sessionId: values.sessionId,
              status: values.status,
            },
          },
        });
      }
    });
  });
};
