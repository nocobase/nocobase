/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import { Sender as AntSender } from '@ant-design/x';
import { useChatBoxContext } from './ChatBoxContext';
import { SenderPrefix } from './SenderPrefix';
import { useT } from '../../locale';
import { SenderHeader } from './SenderHeader';
import { SenderFooter } from './SenderFooter';
import { useChatConversations } from './ChatConversationsProvider';
import { useChatMessages } from './ChatMessagesProvider';

export const Sender: React.FC = () => {
  const t = useT();
  const { currentConversation } = useChatConversations();
  const { responseLoading, cancelRequest } = useChatMessages();
  const senderValue = useChatBoxContext('senderValue');
  const setSenderValue = useChatBoxContext('setSenderValue');
  const senderPlaceholder = useChatBoxContext('senderPlaceholder');
  const send = useChatBoxContext('send');
  const currentEmployee = useChatBoxContext('currentEmployee');
  const showInfoForm = useChatBoxContext('showInfoForm');
  const senderRef = useChatBoxContext('senderRef');
  const [value, setValue] = useState(senderValue);

  useEffect(() => {
    setSenderValue(value);
  }, [value]);

  useEffect(() => {
    setValue(senderValue);
  }, [senderValue]);

  return (
    <AntSender
      value={value}
      ref={senderRef}
      onChange={(value) => {
        setValue(value);
      }}
      onSubmit={(content) =>
        send({
          sessionId: currentConversation,
          aiEmployee: currentEmployee,
          messages: [
            {
              type: 'text',
              content,
            },
          ],
        })
      }
      onCancel={cancelRequest}
      prefix={currentConversation || !showInfoForm ? <SenderPrefix /> : null}
      header={!currentConversation ? <SenderHeader /> : null}
      loading={responseLoading}
      footer={({ components }) => <SenderFooter components={components} />}
      disabled={!currentEmployee}
      placeholder={!currentEmployee ? t('Please choose an AI employee') : senderPlaceholder}
      actions={false}
    />
  );
};
