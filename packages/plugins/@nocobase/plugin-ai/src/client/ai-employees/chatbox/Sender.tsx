/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Sender as AntSender } from '@ant-design/x';
import { useChatBoxContext } from './ChatBoxContext';
import { SenderPrefix } from './SenderPrefix';
import { useT } from '../../locale';
import { SenderFooter } from './SenderFooter';
import { useChatConversations } from './ChatConversationsProvider';
import { useChatMessages } from './ChatMessagesProvider';
import { AIEmployeeHeader } from './AIEmployeeHeader';
import { AttachmentsHeader } from './AttachmentsHeader';

export const Sender: React.FC = () => {
  const t = useT();
  const { currentConversation } = useChatConversations();
  const { responseLoading, cancelRequest, attachments, systemMessage } = useChatMessages();
  const senderValue = useChatBoxContext('senderValue');
  const setSenderValue = useChatBoxContext('setSenderValue');
  const senderPlaceholder = useChatBoxContext('senderPlaceholder');
  const send = useChatBoxContext('send');
  const currentEmployee = useChatBoxContext('currentEmployee');
  const senderRef = useChatBoxContext('senderRef');
  const [value, setValue] = useState(senderValue);

  useEffect(() => {
    if (value !== senderValue) {
      setSenderValue(value);
    }
  }, [value]);

  useEffect(() => {
    setValue(senderValue);
  }, [senderValue]);

  return (
    <AntSender
      // components={{
      //   input: VariableInput,
      // }}
      value={value}
      ref={senderRef}
      onChange={(value) => {
        setValue(value);
      }}
      onSubmit={(content) =>
        send({
          sessionId: currentConversation,
          aiEmployee: currentEmployee,
          systemMessage,
          messages: [
            {
              type: 'text',
              content,
            },
          ],
          attachments,
        })
      }
      onCancel={cancelRequest}
      prefix={<SenderPrefix />}
      header={!currentEmployee ? <AIEmployeeHeader /> : <AttachmentsHeader />}
      loading={responseLoading}
      footer={({ components }) => <SenderFooter components={components} />}
      disabled={!currentEmployee}
      placeholder={!currentEmployee ? t('Please choose an AI employee') : senderPlaceholder}
      actions={false}
    />
  );
};
