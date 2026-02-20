/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { Button, Divider, Flex, GetRef } from 'antd';
import { Upload } from './Upload';
import { AddContextButton } from '../AddContextButton';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatBoxStore } from './stores/chat-box';
import _ from 'lodash';
import { SearchSwitch } from './SearchSwitch';
import { ModelSwitcher } from './ModelSwitcher';
import { AIEmployeeSwitcher } from './AIEmployeeSwitch';

export const SenderFooter: React.FC<{
  components: any;
  handleSubmit: (content: string) => void;
}> = ({ components, handleSubmit }) => {
  const { SendButton, LoadingButton } = components;
  const senderButtonRef = useRef<GetRef<typeof Button> | null>(null);
  const currentEmployee = useChatBoxStore.use.currentEmployee?.();

  const loading = useChatMessagesStore.use.responseLoading();
  const addContextItems = useChatMessagesStore.use.addContextItems();
  const removeContextItem = useChatMessagesStore.use.removeContextItem();

  const senderValue = useChatBoxStore.use.senderValue();
  const contextItems = useChatMessagesStore.use.contextItems();
  const handleEmptySubmit = () => {
    if (_.isEmpty(senderValue) && contextItems.length) {
      handleSubmit('');
    }
  };

  const senderRef = useChatBoxStore.use.senderRef();
  useEffect(() => {
    if (senderRef?.current?.nativeElement) {
      senderRef.current.nativeElement.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (_.isEmpty(senderValue) && contextItems.length) {
            senderButtonRef.current?.click();
          }
        }
      };
    }
  }, [senderRef, senderValue, contextItems]);

  return (
    <Flex justify="space-between" align="center">
      <Flex gap="middle" align="center">
        <AddContextButton
          onAdd={addContextItems}
          onRemove={removeContextItem}
          disabled={!currentEmployee}
          ignore={(key) => key === 'flow-model.variable'}
        />
        <Upload />
        <SearchSwitch />
        <AIEmployeeSwitcher />
        <ModelSwitcher />
      </Flex>
      <Flex align="center" gap="middle">
        {loading ? (
          <LoadingButton type="default" />
        ) : (
          <SendButton ref={senderButtonRef} type="primary" disabled={false} onClick={handleEmptySubmit} />
        )}
      </Flex>
    </Flex>
  );
};
