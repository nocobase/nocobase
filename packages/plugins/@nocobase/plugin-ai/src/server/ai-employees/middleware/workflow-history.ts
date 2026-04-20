/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { AIMessage, createMiddleware, ToolMessage } from 'langchain';
import { AIEmployee } from '../ai-employee';

const WORKFLOW_JOB_LOG_MAX_LENGTH = 200;

const truncateWorkflowJobLogValue = (value: string) =>
  value.length > WORKFLOW_JOB_LOG_MAX_LENGTH ? `${value.slice(0, WORKFLOW_JOB_LOG_MAX_LENGTH)}...` : value;

const normalizeToolMessageContent = (value: unknown) => {
  if (typeof value === 'string') {
    return truncateWorkflowJobLogValue(value);
  }
  try {
    return truncateWorkflowJobLogValue(JSON.stringify(value));
  } catch (error) {
    return truncateWorkflowJobLogValue(String(value ?? ''));
  }
};

const serializeToolCall = (value: unknown) => {
  try {
    return truncateWorkflowJobLogValue(JSON.stringify(value));
  } catch (error) {
    return truncateWorkflowJobLogValue(String(value ?? ''));
  }
};

const appendWorkflowJobLogText = (currentLog: unknown, nextLog: string) => {
  const existingLog = typeof currentLog === 'string' ? currentLog : String(currentLog ?? '');
  if (!existingLog) {
    return nextLog;
  }
  return existingLog.endsWith('\n') ? `${existingLog}${nextLog}` : `${existingLog}\n${nextLog}`;
};

export class WorkflowJobsLogHandler {
  constructor(
    private readonly db: Database,
    private readonly sessionId: string,
  ) {}

  async append(entries: Array<{ type: 'toolMessage' | 'toolCall'; toolCallId?: string; value: unknown }>) {
    if (!entries.length) {
      return;
    }

    const conversation = await this.db.getRepository('aiConversations').findOne({
      filter: {
        sessionId: this.sessionId,
      },
      fields: ['sessionId', 'thread'],
    });
    const task = await this.db.getRepository('aiWorkflowTasks').findOne({
      filter: {
        sessionId: this.sessionId,
      },
    });
    if (!task?.jobId) {
      return;
    }

    const job = await this.db.getModel('jobs').findByPk(task.jobId);
    if (!job) {
      return;
    }

    const thread = conversation?.thread ?? 0;
    const nextLog = entries
      .map(({ type, toolCallId, value }) => {
        const createdAt = new Date().toISOString();
        const payload = type === 'toolCall' ? serializeToolCall(value) : normalizeToolMessageContent(value);
        return `${createdAt} [${this.sessionId}:${thread}] [${toolCallId ?? ''}] ${payload}`;
      })
      .join('\n');
    const currentLog = typeof job.get === 'function' ? job.get('log') : job.log;

    job.set({
      log: appendWorkflowJobLogText(currentLog, nextLog),
    });
    await job.save();
  }
}

export const workflowHistoryMiddleware = (
  aiEmployee: AIEmployee,
  db: Database,
): ReturnType<typeof createMiddleware> => {
  const workflowJobsLogHandler = new WorkflowJobsLogHandler(db, aiEmployee.sessionId);

  return createMiddleware({
    name: 'WorkflowHistoryMiddleware',
    beforeModel: async (state) => {
      const lastToolMessageIndex = state.lastMessageIndex?.lastToolMessageIndex ?? 0;
      const toolMessages = state.messages
        .filter((message) => message.type === 'tool')
        .slice(lastToolMessageIndex)
        .map((message) => message as ToolMessage);

      if (!toolMessages.length) {
        return;
      }

      await workflowJobsLogHandler.append(
        toolMessages.map((toolMessage) => ({
          type: 'toolMessage',
          toolCallId: (toolMessage as any).tool_call_id ?? toolMessage?.artifact?.tool_call_id,
          value: toolMessage.content,
        })),
      );
    },
    afterModel: async (state) => {
      const lastMessage = state.messages.at(-1);
      if (lastMessage?.type === 'ai') {
        const toolCalls = ((lastMessage as AIMessage).tool_calls ?? []) as Array<{ id?: string; args: unknown }>;
        if (toolCalls.length) {
          await workflowJobsLogHandler.append(
            toolCalls.map((toolCall) => ({
              type: 'toolCall',
              toolCallId: toolCall.id,
              value: toolCall,
            })),
          );
        }
      }
    },
  });
};
