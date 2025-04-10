/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { SelectOutlined } from '@ant-design/icons';
import { useChatBoxContext } from './ChatBoxContext';
import { useAISelectionContext } from '../selector/AISelectorProvider';

export const FieldSelector: React.FC = () => {
  const currentEmployee = useChatBoxContext('currentEmployee');
  const senderValue = useChatBoxContext('senderValue');
  const setSenderValue = useChatBoxContext('setSenderValue');
  const senderRef = useChatBoxContext('senderRef');
  const { startSelect } = useAISelectionContext();

  const handleSelect = () => {
    startSelect('fields', {
      onSelect: ({ value }) => {
        if (!value) {
          return;
        }
        setSenderValue(senderValue + value);
        senderRef.current?.focus();
      },
    });
  };

  return <Button disabled={!currentEmployee} type="text" icon={<SelectOutlined />} onClick={handleSelect} />;
};
