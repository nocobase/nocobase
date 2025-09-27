/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatBoxActions } from '../chatbox/hooks/useChatBoxActions';
import { Avatar, Popover } from 'antd';
import { useChatMessagesStore } from '../chatbox/stores/chat-messages';
import { ProfileCard } from '../ProfileCard';
import { avatars } from '../avatars';
import { EditorRef } from '@nocobase/client';
import { isEngineer } from '../built-in/utils';

export interface AICodingButtonProps {
  uid: string;
  scene: string;
  language: string;
  editorRef: EditorRef;
}

export const AICodingButton: React.FC<AICodingButtonProps> = ({ uid, scene, language, editorRef }) => {
  const { aiEmployees } = useAIEmployeesData();
  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { switchAIEmployee } = useChatBoxActions();
  const addContextItems = useChatMessagesStore.use.addContextItems();
  const setEditorRef = useChatMessagesStore.use.setEditorRef();
  const storedEditorRef = useChatMessagesStore.use.editorRef();

  const aiEmployee = aiEmployees.filter((e) => isEngineer(e))[0];

  useEffect(() => {
    setEditorRef(editorRef);
    return () => {
      setEditorRef(null);
    };
  }, [editorRef, setEditorRef]);

  return aiEmployee ? (
    <Popover content={<ProfileCard aiEmployee={aiEmployee} />}>
      <Avatar
        src={avatars(aiEmployee.avatar)}
        size={32}
        shape="circle"
        style={{
          cursor: 'pointer',
          border: '1px solid #eee',
        }}
        onClick={() => {
          if (!open) {
            setOpen(true);
            switchAIEmployee(aiEmployee);
          } else {
            if (currentEmployee?.username !== aiEmployee.username) {
              switchAIEmployee(aiEmployee);
            }
          }

          addContextItems({
            type: 'code-editor',
            uid,
            title: `${scene}(${language})`,
            content: {
              scene,
              language,
              code: storedEditorRef?.read(),
            },
          });
        }}
      />
    </Popover>
  ) : (
    <></>
  );
};
