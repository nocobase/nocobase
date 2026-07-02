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
  JOB_STATUS,
  Processor,
  WorkflowTimeoutError,
  isWorkflowTimeoutError,
} from '@nocobase/plugin-workflow';
import _ from 'lodash';
import PluginAIServer from '../../../plugin';
import { AIEmployee } from '../../../ai-employees/ai-employee';
import { AIEmployeeInstructionConfig } from './types';
import { Files } from './files';
import { isValidFilter } from '@nocobase/utils';
import { SYSTEM_TOOLS } from '@nocobase/ai';
import { AI_WORKFLOW_TASK_STATUS, REQUIRES_APPROVAL, RequiresApproval } from './constants';

export class AIEmployeeInstruction extends Instruction {
  async run(node: FlowNodeModel, input: any, processor: Processor) {
    const {
      username,
      message,
      skillSettings,
      webSearch,
      model,
      requiresApproval = REQUIRES_APPROVAL.NO_REQUIRED,
      userId,
      files,
    }: AIEmployeeInstructionConfig = processor.getParsedValue(node.config, node.id);

    const toolName = SYSTEM_TOOLS.WORK_FLOW_TASK_OUTPUT;
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

    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: input?.id ?? null,
    });

    const abortHandle = processor.createBackgroundAbortHandle();
    await processor.exit();

    const runner = async () => {
      try {
        abortHandle.throwIfAborted();
        if (skillSettings && skillSettings.skillsVersion == null) {
          skillSettings.skillsVersion = 2;
        }
        if (skillSettings && skillSettings.toolsVersion == null) {
          skillSettings.toolsVersion = 2;
        }

        const { conversation, aiWorkflowTasks } = await this.createWorkflowTask({
          username,
          userMessage,
          systemMessage,
          skillSettings,
          requiresApproval,
          toolName,
          node,
          processor,
          jobId: id,
        });

        let currentRoles = input?.result?.roleName;
        if (!currentRoles) {
          const roles = await this.workflow.db.getRepository('rolesUsers').find({
            filter: {
              userId: input?.result?.user?.id ?? userId,
            },
          });
          currentRoles = roles.map((x) => x.roleName);
        }

        const employee = await this.workflow.db.getRepository('aiEmployees').findOne({
          filter: {
            username,
          },
        });
        const plugin = this.workflow.app.pm.get('ai') as PluginAIServer;
        const resolvedModel = await plugin.aiEmployeesManager.resolveModel(employee, model);

        const aiEmployeeContext = {
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
                model: resolvedModel,
              },
            },
          },
        } as any;
        const aiEmployeeActionValues = aiEmployeeContext.action.params.values;

        const aiEmployee = new AIEmployee({
          ctx: aiEmployeeContext,
          employee,
          sessionId: conversation.sessionId,
          systemMessage,
          skillSettings,
          webSearch,
          model: resolvedModel,
          tools: [{ name: toolName }],
        });

        const attachmentPart: Record<string, any> = {};
        if (files?.length) {
          const { resolveAttachments, resolveFileIds, resolveUrls } = Files.resolvers(this.workflow, attachmentPart);
          await resolveAttachments(files);
          await resolveFileIds(files);
          await resolveUrls(files);
        }

        let result;
        let isToolInvoke = false;
        let recoveredFromGraphRecursion = false;
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
          try {
            if (retry > 0) {
              if (retry < 2) {
                abortHandle.throwIfAborted();
                const firstUserMessage = await this.workflow.db
                  .getRepository('aiConversations.messages', conversation.sessionId)
                  .findOne({
                    filter: {
                      role: 'user',
                    },
                    sort: ['messageId'],
                  });
                const messageId = firstUserMessage?.messageId;
                result = await aiEmployee.invoke({ messageId, userMessages, signal: abortHandle.signal });
              } else {
                result = await aiEmployee.invoke({
                  signal: abortHandle.signal,
                  userMessages: [
                    {
                      role: 'user',
                      content: {
                        type: 'text',
                        content: `You failed to call the required tool "${toolName}" in your previous response.
Call "${toolName}" now to submit the workflow outcome.
Do not send another normal assistant response without invoking it.
                  `,
                      },
                    },
                  ],
                });
              }
            } else {
              result = await aiEmployee.invoke({ userMessages, signal: abortHandle.signal });
            }
          } catch (error) {
            if (!isGraphRecursionError(error) || recoveredFromGraphRecursion) {
              throw error;
            }
            recoveredFromGraphRecursion = true;
            processor.logger.warn(`ai employee invoke reached graph recursion limit, trying workflow output recovery`, {
              node: node.id,
              stack: error.stack,
              chatOptions: node.config,
            });
            const latestMessage = await this.workflow.db
              .getRepository('aiConversations.messages', conversation.sessionId)
              .findOne({
                sort: ['-messageId'],
              });
            const recoveryAIEmployee = new AIEmployee({
              ctx: {
                ...aiEmployeeContext,
                action: {
                  params: {
                    values: {
                      ...aiEmployeeActionValues,
                      important: 'GraphRecursionError',
                    },
                  },
                },
              } as any,
              employee,
              sessionId: conversation.sessionId,
              systemMessage,
              skillSettings,
              webSearch,
              model: resolvedModel,
              tools: [{ name: toolName }],
            });
            abortHandle.throwIfAborted();
            result = await recoveryAIEmployee.invoke({
              messageId: latestMessage?.messageId,
              signal: abortHandle.signal,
            });
          }

          abortHandle.throwIfAborted();
          isToolInvoke = result.messages
            .filter((it: any) => it.type === 'ai')
            .flatMap((it: any) => it.tool_calls)
            .some((it: any) => it.name === toolName);
        } while (!isToolInvoke && retry++ < 2);

        if (!isToolInvoke) {
          throw new Error('AI employee not do job correctly');
        }

        await this.checkApproval({
          requiresApproval,
          conversation,
          aiWorkflowTasks,
          result,
          aiEmployee,
          toolName,
          signal: abortHandle.signal,
        });
      } catch (e: any) {
        if (isWorkflowTimeoutError(e) || abortHandle.signal.aborted) {
          // The workflow abort path owns the pending job transition; this runner only closes the AI task surface.
          await this.abortAIWorkflowTask(id);
          return;
        }
        processor.logger.error(`ai employee invoke failed, ${e.message}`, {
          node: node.id,
          stack: e.stack,
          chatOptions: node.config,
        });
        const job = await this.workflow.app.db.getRepository('jobs').findOne({
          filterByTk: id,
        });
        if (!job) {
          await this.abortAIWorkflowTask(id);
          return;
        }
        if (job.status !== JOB_STATUS.PENDING) {
          return;
        }
        job.set({
          status: JOB_STATUS.ERROR,
          result: e.message,
        });
        await this.abortAIWorkflowTask(id);
        await this.workflow.resume(job);
      } finally {
        abortHandle.dispose();
      }
    };

    runner();
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
    jobId,
  }: {
    username: string;
    userMessage: string;
    systemMessage: string;
    skillSettings: AIEmployeeInstructionConfig['skillSettings'];
    requiresApproval: RequiresApproval;
    toolName: string;
    node: FlowNodeModel;
    processor: Processor;
    jobId: number;
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
          status: AI_WORKFLOW_TASK_STATUS.PROCESSING,
          sessionId: conversation.sessionId,
          jobId,
          executionId: processor.execution.id,
          nodeId: node.id,
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

  private async abortAIWorkflowTask(jobId: number | string) {
    const tasks = await this.workflow.db.getRepository('aiWorkflowTasks').find({
      filter: {
        jobId,
      },
      fields: ['id', 'sessionId'],
    });
    const sessionIds = tasks.map((task) => task.sessionId).filter(Boolean);

    await this.workflow.db.getRepository('aiWorkflowTasks').update({
      values: { status: AI_WORKFLOW_TASK_STATUS.ABORTED },
      filter: {
        jobId,
        status: {
          $ne: AI_WORKFLOW_TASK_STATUS.ABORTED,
        },
      },
    });
    if (sessionIds.length) {
      await this.workflow.db.getRepository('aiToolMessages').update({
        values: {
          invokeStatus: 'done',
          status: 'error',
          content: 'Workflow execution aborted.',
          invokeEndTime: new Date(),
        },
        filter: {
          sessionId: {
            $in: sessionIds,
          },
          invokeStatus: {
            $in: ['init', 'interrupted', 'waiting', 'pending'],
          },
        },
      });
    }
  }

  private async checkApproval({
    requiresApproval,
    conversation,
    aiWorkflowTasks,
    result,
    aiEmployee,
    toolName,
    signal,
  }: {
    requiresApproval: RequiresApproval;
    conversation: any;
    aiWorkflowTasks: any;
    result: any;
    aiEmployee: AIEmployee;
    toolName: string;
    signal?: AbortSignal;
  }) {
    if (signal?.aborted) {
      throw signal.reason ?? new WorkflowTimeoutError();
    }
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
      await aiEmployee.invoke({ userDecisions, signal });
      if (signal?.aborted) {
        throw signal.reason ?? new WorkflowTimeoutError();
      }
      await this.workflow.db.getRepository('aiWorkflowTasks').update({
        values: { status: AI_WORKFLOW_TASK_STATUS.APPROVED },
        filter: {
          id: aiWorkflowTasks.id,
          status: {
            $ne: AI_WORKFLOW_TASK_STATUS.ABORTED,
          },
        },
      });
    } else if (requiresApproval !== REQUIRES_APPROVAL.NO_REQUIRED) {
      await this.workflow.db.getRepository('aiWorkflowTasks').update({
        values: { status: AI_WORKFLOW_TASK_STATUS.PENDING_ACCEPTANCE },
        filter: {
          id: aiWorkflowTasks.id,
          status: {
            $ne: AI_WORKFLOW_TASK_STATUS.ABORTED,
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

function isGraphRecursionError(error: unknown): error is Error {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('name' in error || 'lc_error_code' in error) &&
    ((error as { name?: unknown }).name === 'GraphRecursionError' ||
      (error as { lc_error_code?: unknown }).lc_error_code === 'GRAPH_RECURSION_LIMIT')
  );
}

export * from './handler';
export * from './tools';
