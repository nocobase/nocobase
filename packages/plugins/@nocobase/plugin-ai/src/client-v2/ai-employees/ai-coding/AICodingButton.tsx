/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Popover, Tooltip, theme } from 'antd';
import type { EditorRef } from '@nocobase/client-v2';
import { observer, useFlowContext } from '@nocobase/flow-engine';

import { useT } from '../../locale';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { avatars } from '../avatars';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatBoxActions } from '../chatbox/hooks/useChatBoxActions';
import { getGlobalChatBoxRuntime } from '../chatbox/stores/runtime';
import { AIEmployeeProfileCard } from '../ProfileCard';
import type { AIEmployee, Task } from '../types';
import prompts from './prompts';

export interface AICodingButtonProps {
  uid: string;
  name?: string;
  scene: string;
  language: string;
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
  ({ uid, scene, language, editorRef, setActive }) => {
    const t = useT();
    const { token } = theme.useToken();
    const aiConfigRepository = useAIConfigRepository();
    const aiEmployees = aiConfigRepository.aiEmployees;
    const runtime = getGlobalChatBoxRuntime();
    const { chatBoxModel, chatConversationModel } = runtime;
    const open = chatBoxModel.open;
    const currentEmployee = chatBoxModel.currentEmployee;
    const currentConversation = chatConversationModel.currentConversation;
    const chat = useChat(currentConversation, runtime);
    const { triggerTask } = useChatBoxActions(runtime);
    const addContextItems = chat.addContextItems;
    const setEditorRef = chat.setEditorRef;
    const setCurrentEditorRefUid = chat.setCurrentEditorRefUid;
    const ctx = useFlowContext();

    const aiEmployee = aiEmployees.filter((e) => isEngineer(e))[0];

    useEffect(() => {
      aiConfigRepository.getAIEmployees();
    }, [aiConfigRepository]);

    useEffect(() => {
      setEditorRef(uid, editorRef);
      setCurrentEditorRefUid(uid);
      return () => {
        setEditorRef(uid, null);
      };
    }, [uid, editorRef, setEditorRef, setCurrentEditorRefUid]);

    useEffect(() => {
      setActive('AICodingButton', !!aiEmployee);
    }, [aiEmployee, setActive]);

    useEffect(() => {
      chat.setFlowContext(ctx);
    }, [chat, ctx]);

    const [showTooltip, setShowTooltip] = useState(false);
    const [errorOccurred, setErrorOccurred] = useState(false);

    useEffect(() => {
      const isError = editorRef.logs.some((log) => log.level === 'error');
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
    }, [editorRef.logs]);

    const taskMap = useMemo<Record<string, Task>>(() => {
      const createTask = (prototype: Partial<Task>): Task => {
        const { message, ...rest } = prototype;
        return {
          message: {
            workContext: [
              {
                type: 'code-editor',
                uid,
                title: `${scene}(${language})`,
                content: {
                  scene,
                  language,
                  code: editorRef.read(),
                },
              },
            ],
            ...(message ?? {}),
          },
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
    }, [editorRef, errorOccurred, language, scene, t, uid]);

    const tasks = useMemo(() => Object.values(taskMap), [taskMap]);

    if (!aiEmployee) {
      return null;
    }

    const addCodeEditorContext = () => {
      setCurrentEditorRefUid(uid);
      addContextItems({
        type: 'code-editor',
        uid,
        title: `${scene}(${language})`,
        content: {
          scene,
          language,
          code: editorRef.read(),
        },
      });
    };

    const handleAvatarClick = () => {
      if (!open || currentEmployee?.username !== aiEmployee.username) {
        const hasError = editorRef.logs.some((log) => log.level === 'error');
        triggerTask({ aiEmployee, tasks: hasError ? [taskMap.logsDiagnosis] : tasks }).catch(console.error);
      }
      addCodeEditorContext();
    };

    const handleTaskClick = (task: Task) => {
      triggerTask({ aiEmployee, tasks: [task] }).catch(console.error);
      addCodeEditorContext();
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
        title={t('Oops! Something went wrong. Let me diagnose and fix it.')}
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
