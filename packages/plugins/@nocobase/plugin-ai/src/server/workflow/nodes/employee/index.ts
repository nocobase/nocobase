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
    const workflowSystemPrompt = `
You are operating inside a workflow.
Your job is to complete the workflow task and return the final outcome to the workflow, not to reply freely as a normal assistant.
Use normal assistant messages only for reasoning that leads to tool calls; do not place the final outcome in a normal assistant message.
When the task is ready to be submitted, you must call **${toolName}** to return it to the workflow.
Do not treat **${toolName}** as optional, and do not finish the task without calling it.
`.trim();
    const systemMessage = `${workflowSystemPrompt}\n\n${
      typeof message.system === 'object' ? JSON.stringify(message.system) : message.system
    }`;
    const userMessage = `Current workflow task description: \n\n ${
      typeof message.user === 'object' ? JSON.stringify(message.user) : message.user
    }`;

    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: input?.id ?? null,
    });

    const runner = async () => {
      const { conversation, aiWorkflowTasks } = await this.createWorkflowTask({
        userId: input?.result?.user?.id ?? userId,
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
          auth: {
            user: {
              id: input?.result?.user?.id ?? userId,
            },
          },
          action: {
            params: {
              values: {
                sessionId: conversation.sessionId,
                model,
              },
            },
          },
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

      let result;
      let isToolInvoke = false;
      let retry = 0;
      do {
        const userMessages = [
          {
            role: 'user',
            content: {
              type: 'text',
              content: userMessage,
            },
            ...attachmentPart,
          },
        ];
        if (retry > 0) {
          if (retry < 2) {
            const firstUserMessage = await this.workflow.db
              .getRepository('aiConversations.messages', conversation.sessionId)
              .findOne({
                filter: {
                  role: 'user',
                },
                sort: ['messageId'],
              });
            const messageId = firstUserMessage?.messageId;
            result = await aiEmployee.invoke({ messageId, userMessages });
          } else {
            result = await aiEmployee.invoke({
              userMessages: [
                {
                  role: 'user',
                  content: {
                    type: 'text',
                    content: `You failed to call the required tool "aiEmployeeWorkflowTaskOutput" in your previous response.
Call "aiEmployeeWorkflowTaskOutput" now to submit the workflow outcome.
Do not send another normal assistant response without invoking it.
                  `,
                  },
                },
              ],
            });
          }
        } else {
          result = await aiEmployee.invoke({ userMessages });
        }

        isToolInvoke = result.messages
          .filter((it) => it.type === 'ai')
          .flatMap((it) => it.tool_calls)
          .some((it) => it.name === toolName);
      } while (!isToolInvoke && retry++ < 2);

      if (isToolInvoke) {
        await this.checkApproval({ requiresApproval, conversation, aiWorkflowTasks, result, aiEmployee, toolName });
      } else {
        job.set({
          status: JOB_STATUS.ERROR,
          result: 'AI employee not do job correctly',
        });
        await this.workflow.resume(job);
      }
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
      this.workflow.resume(job);
    });

    processor.exit();
    return job;
  }

  resume(node: FlowNodeModel, job: any, processor: Processor) {
    return job;
  }

  private async createWorkflowTask({
    userId,
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
    userId: string;
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
        category: 'task',
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
          status: {
            $ne: 'aborted',
          },
        },
      });
    } else if (requiresApproval !== 'no_required') {
      await this.workflow.db.getRepository('aiWorkflowTasks').update({
        values: { status: 'pending_acceptance' },
        filter: {
          id: aiWorkflowTasks.id,
          status: {
            $ne: 'aborted',
          },
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

export * from './handler';
export * from './tools';
