/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { observer } from '@nocobase/flow-engine';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatBoxActions } from '../chatbox/hooks/useChatBoxActions';
import { Avatar, Popover } from 'antd';
import { codeEditorStore } from './stores';
import { useChatMessagesStore } from '../chatbox/stores/chat-messages';
import { ProfileCard } from '../ProfileCard';
import { avatars } from '../avatars';
import { EditorRef } from '@nocobase/client';

export const AICodingButton: React.FC<{ uid: string; editorRef: EditorRef }> = observer(({ uid, editorRef }) => {
  const { aiEmployees } = useAIEmployeesData();
  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { switchAIEmployee } = useChatBoxActions();
  const addContextItems = useChatMessagesStore.use.addContextItems();

  const aiEmployee = aiEmployees[0];

  useEffect(() => {
    codeEditorStore.focus(editorRef);
  }, [editorRef]);

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
          }
          if (currentEmployee?.username !== aiEmployee.username) {
            switchAIEmployee(aiEmployee);
          }
          addContextItems({ type: 'code-editor', uid, content: codeEditorStore.read() });
        }}
      />
    </Popover>
  ) : (
    <></>
  );
});
