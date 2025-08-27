/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-nocheck
import React, { useMemo } from 'react';
import { Button, Dropdown } from 'antd';
import { useT } from '../locale';
import { AppstoreAddOutlined } from '@ant-design/icons';
import { Schema } from '@formily/react';
import { usePlugin } from '@nocobase/client';
import PluginAIClient from '..';
import { ContextItem, WorkContextOptions } from './types';
import { useFlowEngine } from '@nocobase/flow-engine';

const walkthrough = (
  workContexts: WorkContextOptions[],
  callback: (parent: string, workContext: WorkContextOptions) => void,
) => {
  const queue = workContexts.map((workContext) => ({ parent: null, workContext }));
  while (queue.length) {
    const { parent, workContext } = queue.shift();
    callback(parent, workContext);
    if (workContext.children) {
      queue.push(
        ...Object.entries(workContext.children).map(([name, child]) => ({
          parent: workContext.name,
          workContext: { name, ...child },
        })),
      );
    }
  }
};

export const AddContextButton: React.FC<{
  onAdd: (item: ContextItem) => void;
  disabled?: boolean;
}> = ({ onAdd, disabled }) => {
  const t = useT();
  const flowEngine = useFlowEngine();
  const plugin = usePlugin('ai') as PluginAIClient;
  const workContext = plugin.aiManager.workContext;

  const [items, onClick] = useMemo(() => {
    const context = Array.from(workContext.getValues());

    const menuItems: MenuProps['items'] = [];
    const menuItemMapping = new Map<string, MenuProps['items'][0]>();
    const contextItemMapping = new Map<string, WorkContextOptions>();
    walkthrough(context, (parent, contextItem) => {
      if (!contextItem.menu) {
        return;
      }

      const key = parent ? `${parent}.${contextItem.name}` : contextItem.name;
      const C = contextItem.menu.Component;
      const item: MenuProps['items'] = {
        key,
        label: C ? <C /> : Schema.compile(contextItem.menu.label, { t }),
        icon: contextItem.menu.icon,
      };

      menuItemMapping.set(contextItem.name, item);
      contextItemMapping.set(key, contextItem);
      if (parent && menuItemMapping.has(parent)) {
        const parentMenu = menuItemMapping.get(parent);
        if (!parentMenu.children) {
          parentMenu.children = [];
        }
        parentMenu.children.push(item);
      } else {
        menuItems.push(item);
      }
    });

    const onClick = (e) => {
      const workContextItem = contextItemMapping.get(e.key);
      const clickHandler = workContextItem?.menu?.clickHandler?.({
        flowEngine,
        onAdd: (contextItem) =>
          onAdd({
            type: e.key,
            ...contextItem,
          }),
      });
      clickHandler?.();
    };

    return [menuItems, onClick];
  }, [workContext]);

  return (
    <Dropdown
      menu={{ items, onClick }}
      placement="topLeft"
      disabled={disabled}
      overlayStyle={{
        zIndex: 2000,
      }}
    >
      <Button variant="dashed" color="default" size="small" icon={<AppstoreAddOutlined />} disabled={disabled}>
        {t('Add work context')}
      </Button>
    </Dropdown>
  );
};
