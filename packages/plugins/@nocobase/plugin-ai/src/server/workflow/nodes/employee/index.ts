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

export class AIEmployeeInstruction extends Instruction {
  run(node: FlowNodeModel, input: any, processor: Processor): InstructionResult {
    const {
      username,
      message,
      skillSettings,
      webSearch,
      model,
      requiresApproval,
      assignees,
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
        assignees,
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

      await this.workflow.db.getRepository('aiWorkflowTasks').update({
        values: { status: 'pending_acceptance' },
        filter: {
          id: aiWorkflowTasks.id,
          status: 'processing',
        },
      });

      await this.autoApproval({ conversation, aiWorkflowTasks, result, aiEmployee, toolName });
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
    assignees,
    toolName,
    node,
    processor,
    job,
  }: {
    username: string;
    userMessage: string;
    systemMessage: string;
    skillSettings: AIEmployeeInstructionConfig['skillSettings'];
    requiresApproval?: boolean;
    assignees?: string[];
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

      if (requiresApproval === true && assignees?.length) {
        await this.workflow.db.getRepository('usersAiWorkflowTasks').create({
          values: assignees.map((userId) => ({
            userId,
            aiWorkflowTaskId: aiWorkflowTasks.id,
          })),
          transaction,
        });
      }

      return { conversation, aiWorkflowTasks };
    });
  }

  private async autoApproval({
    conversation,
    aiWorkflowTasks,
    result,
    aiEmployee,
    toolName,
  }: {
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
    if (!(toolCall?.args?.requiresApproval === false)) {
      return;
    }
    await this.workflow.db.getRepository('aiWorkflowTasks').update({
      values: { status: 'pending_approval' },
      filter: {
        id: aiWorkflowTasks.id,
        status: 'pending_acceptance',
      },
    });
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
        status: 'pending_approval',
      },
    });
  }
}

export const registerAIEmployeeTaskNotification = (plugin: PluginAIServer) => {
  plugin.db.on('aiWorkflowTasks.beforeSave', async (model: Model, options: Transactionable) => {
    if (!model.isNewRecord && !model.changed('status')) {
      return;
    }
    const values = model.toJSON();
    options.transaction?.afterCommit(async () => {
      const assignees = await plugin.db.getRepository('usersAiWorkflowTasks').find({
        filter: {
          aiWorkflowTaskId: values.id,
        },
      });
      if (!assignees?.length) {
        return;
      }

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
