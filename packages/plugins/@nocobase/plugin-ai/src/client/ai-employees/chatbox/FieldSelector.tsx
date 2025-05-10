/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Tooltip } from 'antd';
import { SelectOutlined } from '@ant-design/icons';
import { useChatBoxContext } from './ChatBoxContext';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { useT } from '../../locale';
import { useOnInsert } from '../useOnInsert';

export const FieldSelector: React.FC = () => {
  const currentEmployee = useChatBoxContext('currentEmployee');
  const senderRef = useChatBoxContext('senderRef');
  const { startSelect, stopSelect, selectable } = useAISelectionContext();
  const t = useT();
  const { onInsert } = useOnInsert();

  const handleSelect = () => {
    if (selectable === 'fields') {
      stopSelect();
      return;
    }
    startSelect('fields', {
      onSelect: ({ value }) => {
        if (!value) {
          return;
        }
        onInsert(() => {
          return senderRef.current?.nativeElement.querySelector('.ant-input');
        }, value);
        senderRef.current?.focus();
      },
    });
  };

  return (
    <Tooltip title={t('Select field values')} arrow={false}>
      <Button
        disabled={!currentEmployee}
        variant="text"
        color={selectable === 'fields' ? 'primary' : 'default'}
        icon={<SelectOutlined />}
        onClick={handleSelect}
      />
    </Tooltip>
  );
};
