/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Dropdown } from 'antd';
import { useT } from '../../locale';
import { useChatBoxContext } from './ChatBoxContext';
import { AppstoreAddOutlined, FileOutlined, BuildOutlined, SelectOutlined, StarOutlined } from '@ant-design/icons';
import { useAISelectionContext } from '../selector/AISelectorProvider';

export const AddContextButton: React.FC = () => {
  const t = useT();
  const currentEmployee = useChatBoxContext('currentEmployee');
  const { startSelect } = useAISelectionContext();

  const items = [
    {
      icon: <StarOutlined />,
      key: 'modern-pages',
      label: t('Modern pages'),
    },
    {
      icon: <FileOutlined />,
      key: 'classic-pages',
      label: t('Classic pages'),
      children: [
        {
          key: 'block',
          icon: <BuildOutlined />,
          label: t('Select block UI schemas'),
          onClick: () => {
            startSelect('blocks', {
              onSelect: ({ uid }) => {
                if (!uid) {
                  return;
                }
              },
            });
          },
        },
        {
          key: 'field',
          icon: <SelectOutlined />,
          label: t('Select field value'),
          onClick: () => {
            // Logic to add a classic page context
          },
        },
      ],
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="topLeft" disabled={!currentEmployee}>
      <Button variant="dashed" color="default" size="small" icon={<AppstoreAddOutlined />} disabled={!currentEmployee}>
        {t('Add work context')}
      </Button>
    </Dropdown>
  );
};
