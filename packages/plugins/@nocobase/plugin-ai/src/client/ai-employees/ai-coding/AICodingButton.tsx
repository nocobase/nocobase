/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatBoxActions } from '../chatbox/hooks/useChatBoxActions';
import { Avatar, Popover, Tooltip } from 'antd';
import { useChatMessagesStore } from '../chatbox/stores/chat-messages';
import { ProfileCard } from '../ProfileCard';
import { avatars } from '../avatars';
import { EditorRef, useCompile } from '@nocobase/client';
import { useFlowContext } from '@nocobase/flow-engine';
import { isEngineer } from '../built-in/utils';
import { Task } from '../types';
import { useT } from '../../locale';
import prompts from './prompts';

export interface AICodingButtonProps {
  uid: string;
  scene: string;
  language: string;
  editorRef: EditorRef;
  setActive: (key: string, active: boolean) => void;
}

export const AICodingButton: React.FC<AICodingButtonProps> = ({ uid, scene, language, editorRef, setActive }) => {
  const t = useT();
  const compile = useCompile();
  const { aiEmployees } = useAIEmployeesData();
  const open = useChatBoxStore.use.open();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { triggerTask } = useChatBoxActions();
  const addContextItems = useChatMessagesStore.use.addContextItems();
  const setEditorRef = useChatMessagesStore.use.setEditorRef();
  const setCurrentEditorRefUid = useChatMessagesStore.use.setCurrentEditorRefUid();
  const ctx = useFlowContext();

  const buildCtxVariablesDesc = () => {
    const metaTree = ctx?.getPropertyMetaTree?.() || [];
    return metaTree
      .filter((node) => {
        const disabled = typeof node.disabled === 'function' ? node.disabled() : node.disabled;
        return !disabled;
      })
      .map((node) => {
        const paths = node.paths?.length ? node.paths : [node.name].filter(Boolean);
        const fullPath = ['ctx', ...paths].join('.');
        const nodeTitle = compile(node.title, { t });
        const title = nodeTitle && nodeTitle !== node.name ? ` (${nodeTitle})` : '';
        return `- {{${fullPath}}}${title}`;
      })
      .join('\n');
  };

  const aiEmployee = aiEmployees.filter((e) => isEngineer(e))[0];

  useEffect(() => {
    setEditorRef(uid, editorRef);
    setCurrentEditorRefUid(uid);
    return () => {
      setEditorRef(uid, null);
    };
  }, [uid, editorRef, setEditorRef, setCurrentEditorRefUid]);

  useEffect(() => {
    if (aiEmployee) {
      setActive('AICodingButton', true);
    } else {
      setActive('AICodingButton', false);
    }
  }, [aiEmployee, setActive]);

  const [showTooltip, setShowTooltip] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  useEffect(() => {
    const isError = editorRef.logs.find((log) => log.level === 'error') !== undefined;
    setErrorOccurred(isError);
    setShowTooltip(isError);
    if (isError) {
      setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
    }
  }, [editorRef.logs]);

  const TaskTemplate = (prototype: Partial<Task>) => {
    const { message, ...rest } = prototype;
    const variablesDesc = buildCtxVariablesDesc();
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
              code: editorRef?.read(),
            },
          },
          variablesDesc
            ? {
                type: 'text',
                uid: 'available-variables',
                title: 'Available variables',
                content: `You can access the following variables via context:\n${variablesDesc}`,
              }
            : null,
        ].filter(Boolean),
        ...(message ?? {}),
      },
      autoSend: false,
      ...rest,
    };
  };

  const taskMap: Record<string, Task> = {
    generateCode: TaskTemplate({ title: t('Start coding') }),
    codeReview: TaskTemplate({
      title: t('Code review'),
      message: { user: t('please review the code'), system: prompts.codeReview },
    }),
    logsDiagnosis: TaskTemplate({
      title: t('Diagnose and fix the error'),
      message: {
        user: t('please fix the error'),
        system: `Here is run logs:${JSON.stringify(
          editorRef?.logs,
        )} \n analyze the code and run logs, then fix the problems existing in the code`,
      },
      autoSend: errorOccurred,
    }),
  };

  const tasks: Task[] = Object.values(taskMap);

  return aiEmployee ? (
    <Tooltip
      placement="topRight"
      title={t('Oops! Something went wrong. Let me diagnose and fix it.')}
      open={showTooltip}
      styles={{ root: { maxWidth: 500 } }}
    >
      <Popover content={<ProfileCard aiEmployee={aiEmployee} tasks={tasks} />}>
        <Avatar
          src={avatars(aiEmployee.avatar)}
          size={32}
          shape="circle"
          style={{
            cursor: 'pointer',
            border: '1px solid #eee',
          }}
          onClick={() => {
            if (!open || currentEmployee?.username !== aiEmployee.username) {
              if (editorRef.logs.find((log) => log.level === 'error')) {
                triggerTask({ aiEmployee, tasks: [taskMap['logsDiagnosis']] });
              } else {
                triggerTask({ aiEmployee, tasks });
              }
            }

            setCurrentEditorRefUid(uid);

            const variablesDesc = buildCtxVariablesDesc();

            addContextItems({
              type: 'code-editor',
              uid,
              title: `${scene}(${language})`,
              content: {
                scene,
                language,
                code: editorRef?.read(),
              },
            });

            if (variablesDesc) {
              addContextItems({
                type: 'text',
                uid: 'available-variables',
                title: 'Available variables',
                content: `You can access the following variables via context:\n${variablesDesc}`,
              });
            }
          }}
        />
      </Popover>
    </Tooltip>
  ) : (
    <></>
  );
};
