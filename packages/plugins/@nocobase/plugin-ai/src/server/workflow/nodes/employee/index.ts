/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowNodeModel, Instruction, InstructionResult, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';
import _ from 'lodash';
import PluginAIServer from '../../../plugin';
import { AIEmployee } from '../../../ai-employees/ai-employee';

export class AIEmployeeInstruction extends Instruction {
  run(node: FlowNodeModel, input: any, processor: Processor): InstructionResult {
    const ai = this.workflow.app.pm.get(PluginAIServer);
    const { username, message, skillSettings, webSearch, model, requiresApproval, assignees } =
      processor.getParsedValue(node.config, node.id);
    const toolName = 'aiEmployeeWorkflowTaskOutput@' + node.id;
    const systemMessage = `You are invoked by workflow, after done your job, call tool **${toolName}**\n\n${
      typeof message.system === 'object' ? JSON.stringify(message.system) : message.system
    }`;
    const userMessage = typeof message.user === 'object' ? JSON.stringify(message.user) : message.user;
    const agent = async () => {
      const conversation = await this.workflow.db.sequelize.transaction(async (transaction) => {
        const conversation = await ai.aiConversationsManager.create({
          aiEmployee: {
            username,
          },
          title: userMessage.slice(0, 30),
          from: 'sub-agent',
          options: {
            skillSettings,
          },
          transaction,
        });

        const aiWorkflowTasks = await this.workflow.db.getRepository('aiWorkflowTasks').create({
          values: {
            id: this.workflow.app.snowflakeIdGenerator.generate(),
            workflowTitle: processor.execution.workflow.title,
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

        if (assignees?.length) {
          await this.workflow.db.getRepository('usersAiWorkflowTasks').create({
            values: assignees.map((userId) => ({
              userId,
              aiWorkflowTaskId: aiWorkflowTasks.id,
            })),
            transaction,
          });
        }

        return conversation;
      });

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
          state: { currentRoles: input.result.roleName },
        } as any,
        employee,
        sessionId: conversation.sessionId,
        systemMessage,
        skillSettings,
        webSearch,
        model,
        tools: [{ name: toolName }],
      });

      const result = await aiEmployee.invoke({
        userMessages: [
          {
            role: 'user',
            content: {
              type: 'text',
              content: userMessage,
            },
          },
        ],
      });

      return result;
    };

    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: input?.id ?? null,
    });

    agent().catch((e) => {
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

    processor.logger.trace(`llm invoke, waiting for response...`, {
      node: node.id,
    });
    return processor.exit();
  }

  resume(node: FlowNodeModel, job: any, processor: Processor) {
    return job;
  }
}
