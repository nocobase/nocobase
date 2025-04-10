/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo } from 'react';
import { Sender as AntSender } from '@ant-design/x';
import { useChatBoxContext } from './ChatBoxContext';
import { SenderPrefix } from './SenderPrefix';
import { Attachment } from './Attachment';
import { AIEmployeeHeader } from './AIEmployeeHeader';
import { useT } from '../../locale';
import { SenderHeader } from './SenderHeader';
import { SenderFooter } from './SenderFooter';

export const Sender: React.FC = memo(() => {
  const t = useT();
  const senderValue = useChatBoxContext('senderValue');
  const setSenderValue = useChatBoxContext('setSenderValue');
  const senderPlaceholder = useChatBoxContext('senderPlaceholder');
  const send = useChatBoxContext('send');
  const currentConversation = useChatBoxContext('currentConversation');
  const currentEmployee = useChatBoxContext('currentEmployee');
  const responseLoading = useChatBoxContext('responseLoading');
  const showInfoForm = useChatBoxContext('showInfoForm');
  const senderRef = useChatBoxContext('senderRef');
  return (
    <AntSender
      value={senderValue}
      ref={senderRef}
      onChange={(value) => {
        setSenderValue(value);
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
      prefix={currentConversation || !showInfoForm ? <SenderPrefix /> : null}
      header={!currentConversation ? <SenderHeader /> : null}
      loading={responseLoading}
      footer={({ components }) => <SenderFooter components={components} />}
      disabled={!currentEmployee}
      placeholder={!currentEmployee ? t('Please choose an AI employee') : senderPlaceholder}
      actions={false}
    />
  );
});
