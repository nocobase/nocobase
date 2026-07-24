/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Popover, Tooltip, theme } from 'antd';
import { useApp, type EditorRef } from '@nocobase/client-v2';
import { observer, useFlowContext } from '@nocobase/flow-engine';

import { useT } from '../../locale';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { avatars } from '../avatars';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatBoxActions } from '../chatbox/hooks/useChatBoxActions';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatConversationsStore } from '../chatbox/stores/chat-conversations';
import { getChatApplicationKey } from '../chatbox/stores/chat-messages';
import { AIEmployeeProfileCard } from '../ProfileCard';
import type { AIEmployee, ChatCodingTarget, ContextItem, Task, WorkspaceChatCodingTarget } from '../types';
import prompts from './prompts';

export interface AICodingButtonProps {
  uid: string;
  name?: string;
  scene: string;
  language: string;
  authoringSurfaceId?: string;
  editorRef: EditorRef;
  setActive: (key: string, active: boolean) => void;
}

const isBuiltIn = (aiEmployee: AIEmployee) => {
  return aiEmployee?.builtIn && aiEmployee?.deprecated !== true;
};

const isEngineer = (aiEmployee: AIEmployee) => {
  return isBuiltIn(aiEmployee) && aiEmployee.username === 'nathan';
};

export const AICodingButton: React.FC<AICodingButtonProps> = observer(
  ({ uid, scene, language, authoringSurfaceId, editorRef, setActive }) => {
    const t = useT();
    const app = useApp();
    const { token } = theme.useToken();
    const aiConfigRepository = useAIConfigRepository();
    const aiEmployees = aiConfigRepository.aiEmployees;
    const open = useChatBoxStore.use.open();
    const currentEmployee = useChatBoxStore.use.currentEmployee();
    const currentConversation = useChatConversationsStore.use.currentConversation();
    const chat = useChat(currentConversation);
    const { triggerTask } = useChatBoxActions();
    const ctx = useFlowContext();
    const applicationKey = useMemo(() => getChatApplicationKey(app), [app]);
    const codingContextRequestRef = useRef(0);
    const latestAuthoringSurfaceIdRef = useRef(authoringSurfaceId);
    const latestConversationRef = useRef(currentConversation);
    latestAuthoringSurfaceIdRef.current = authoringSurfaceId;
    latestConversationRef.current = currentConversation;

    const aiEmployee = aiEmployees.filter((e) => isEngineer(e))[0];

    useEffect(() => {
      aiConfigRepository.getAIEmployees();
    }, [aiConfigRepository]);

    useEffect(() => {
      if (authoringSurfaceId) {
        return;
      }
      return chat.registerEditorRef(applicationKey, uid, editorRef);
    }, [applicationKey, authoringSurfaceId, chat, editorRef, uid]);

    useEffect(() => {
      setActive('AICodingButton', !!aiEmployee);
    }, [aiEmployee, setActive]);

    useEffect(
      () => () => {
        codingContextRequestRef.current += 1;
      },
      [],
    );

    const [showTooltip, setShowTooltip] = useState(false);
    const [errorOccurred, setErrorOccurred] = useState(false);
    const [targetMismatch, setTargetMismatch] = useState(false);

    useEffect(() => {
      const isError = !authoringSurfaceId && editorRef.logs.some((log) => log.level === 'error');
      setErrorOccurred(isError);
      setShowTooltip(isError);
      if (!isError) {
        return;
      }
      const timer = window.setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
      return () => {
        window.clearTimeout(timer);
      };
    }, [authoringSurfaceId, editorRef.logs]);

    const taskMap = useMemo<Record<string, Task>>(() => {
      const createTask = (prototype: Partial<Task>): Task => {
        const { message, ...rest } = prototype;
        return {
          message,
          autoSend: false,
          ...rest,
        };
      };

      return {
        generateCode: createTask({ title: t('Start coding') }),
        codeReview: createTask({
          title: t('Code review'),
          message: { user: t('please review the code'), system: prompts.codeReview },
        }),
        logsDiagnosis: createTask({
          title: t('Diagnose and fix the error'),
          message: {
            user: t('please fix the error'),
            system: `Here is run logs:${JSON.stringify(
              editorRef.logs,
            )} \n analyze the code and run logs, then fix the problems existing in the code`,
          },
          autoSend: errorOccurred,
        }),
      };
    }, [editorRef.logs, errorOccurred, t]);

    const tasks = useMemo(() => Object.values(taskMap), [taskMap]);

    if (!aiEmployee) {
      return null;
    }

    const resolveCodingContext = async (
      requestId: number,
    ): Promise<{ target: ChatCodingTarget; item: ContextItem } | null> => {
      if (authoringSurfaceId) {
        const surface = app.aiManager.authoringSurfaces.get(authoringSurfaceId);
        if (!surface) {
          setShowTooltip(true);
          return null;
        }
        const snapshot = await surface.describe();
        if (
          codingContextRequestRef.current !== requestId ||
          latestAuthoringSurfaceIdRef.current !== authoringSurfaceId
        ) {
          return null;
        }
        if (
          app.aiManager.authoringSurfaces.get(authoringSurfaceId) !== surface ||
          snapshot.surfaceId !== authoringSurfaceId
        ) {
          setShowTooltip(true);
          return null;
        }
        const target: WorkspaceChatCodingTarget = {
          type: 'workspace',
          applicationKey,
          surfaceId: authoringSurfaceId,
          kind: snapshot.kind,
          title: snapshot.title,
        };
        return {
          target,
          item: {
            type: 'code-workspace',
            uid: authoringSurfaceId,
            title: snapshot.title,
            content: {
              surfaceId: authoringSurfaceId,
              kind: snapshot.kind,
              title: snapshot.title,
            },
          },
        };
      }

      return {
        target: {
          type: 'single-file',
          applicationKey,
          editorUid: uid,
        },
        item: {
          type: 'code-editor',
          uid,
          title: `${scene}(${language})`,
          content: {
            scene,
            language,
            code: editorRef.read(),
          },
        },
      };
    };

    const bindCodingContext = async (willTriggerTask: boolean, taskList?: Task[]) => {
      const requestedConversation = currentConversation;
      const requestId = codingContextRequestRef.current + 1;
      codingContextRequestRef.current = requestId;
      const resolved = await resolveCodingContext(requestId);
      if (!resolved || latestConversationRef.current !== requestedConversation) {
        return;
      }
      const targetChat = willTriggerTask && currentConversation ? chat.for(undefined) : chat;
      const targetBinding = targetChat.bindCodingTarget(resolved.target, ctx);
      if (targetBinding.status === 'mismatch') {
        setTargetMismatch(true);
        setShowTooltip(true);
        return;
      }
      setTargetMismatch(false);
      const resolvedTasks = taskList?.map((task) => ({
        ...task,
        message: {
          ...(task.message ?? {}),
          workContext: [resolved.item],
        },
      }));
      if (willTriggerTask) {
        await triggerTask({ aiEmployee, tasks: resolvedTasks });
      }
      targetChat.addContextItems(resolved.item);
    };

    const handleAvatarClick = () => {
      const shouldTriggerTask = !open || currentEmployee?.username !== aiEmployee.username;
      const hasError = !authoringSurfaceId && editorRef.logs.some((log) => log.level === 'error');
      bindCodingContext(shouldTriggerTask, hasError ? [taskMap.logsDiagnosis] : tasks).catch(console.error);
    };

    const handleTaskClick = (task: Task) => {
      bindCodingContext(true, [task]).catch(console.error);
    };

    const handleAvatarKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleAvatarClick();
      }
    };

    return (
      <Tooltip
        placement="topRight"
        title={targetMismatch ? t('New conversation') : t('Oops! Something went wrong. Let me diagnose and fix it.')}
        open={showTooltip}
        styles={{ root: { maxWidth: token.screenXS } }}
      >
        <Popover
          content={<AIEmployeeProfileCard aiEmployee={aiEmployee} tasks={tasks} onTaskClick={handleTaskClick} />}
        >
          <span
            role="button"
            tabIndex={0}
            aria-label={t('AI coding assistant')}
            onClick={handleAvatarClick}
            onKeyDown={handleAvatarKeyDown}
          >
            <Avatar
              src={aiEmployee.avatar ? avatars(aiEmployee.avatar) : undefined}
              size={token.controlHeight}
              shape="circle"
              style={{
                cursor: 'pointer',
                border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
              }}
            />
          </span>
        </Popover>
      </Tooltip>
    );
  },
);
