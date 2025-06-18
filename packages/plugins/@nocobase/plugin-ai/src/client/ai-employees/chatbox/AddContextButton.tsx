/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Button, Dropdown } from 'antd';
import { useT } from '../../locale';
import { useChatBoxContext } from './ChatBoxContext';
import { AppstoreAddOutlined } from '@ant-design/icons';
import { Schema } from '@formily/react';
import { usePlugin } from '@nocobase/client';
import PluginAIClient from '../..';
import { useChatMessages } from './ChatMessagesProvider';

export const AddContextButton: React.FC = () => {
  const t = useT();
  const currentEmployee = useChatBoxContext('currentEmployee');
  const plugin = usePlugin('ai') as PluginAIClient;
  const workContext = plugin.aiManager.workContext;
  const { addContextItems } = useChatMessages();

  const items = useMemo(() => {
    const context = workContext.getValues();
    const result = Array.from(context).reduce((prev, cur) => {
      if (!cur.menu) {
        return prev;
      }
      const C = cur.menu.Component;
      const item = {
        key: cur.name,
        label: C ? (
          <C
            addContextItem={(contextItem) =>
              addContextItems({
                type: cur.name,
                ...contextItem,
              })
            }
          />
        ) : (
          Schema.compile(cur.menu.label, { t })
        ),
        icon: cur.menu.icon,
      };
      if (!cur.children) {
        return [...prev, item];
      }
      const children = Object.entries(cur.children).reduce((childPrev, [childName, childCur]) => {
        if (!childCur.menu) {
          return childPrev;
        }
        const C = childCur.menu.Component;
        const key = `${cur.name}.${childName}`;
        return [
          ...childPrev,
          {
            key,
            label: C ? (
              <C
                addContextItem={(contextItem) =>
                  addContextItems({
                    type: key,
                    ...contextItem,
                  })
                }
              />
            ) : (
              Schema.compile(childCur.menu.label, { t })
            ),
            icon: childCur.menu.icon,
          },
        ];
      }, []);
      return [
        ...prev,
        {
          ...item,
          children,
        },
      ];
    }, []);
    return result;
  }, [workContext]);

  return (
    <Dropdown menu={{ items }} placement="topLeft" disabled={!currentEmployee}>
      <Button variant="dashed" color="default" size="small" icon={<AppstoreAddOutlined />} disabled={!currentEmployee}>
        {t('Add work context')}
      </Button>
    </Dropdown>
  );
};
