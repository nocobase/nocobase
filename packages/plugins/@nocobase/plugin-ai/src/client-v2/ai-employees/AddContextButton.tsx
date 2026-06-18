/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { AppstoreAddOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import { useApp } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useT } from '../locale';
import type { AIManager } from '../manager/ai-manager';
import type { ContextItem, WorkContextOptions } from './types';
import { useChatMessageActions } from './chatbox/hooks/useChatMessageActions';

type AIPluginLike = {
  aiManager?: AIManager;
};

type WalkthroughItem = {
  parent?: string;
  workContext: WorkContextOptions;
};

const walkthrough = (
  workContexts: WorkContextOptions[],
  callback: (parent: string | undefined, workContext: WorkContextOptions) => void,
) => {
  const queue: WalkthroughItem[] = workContexts.map((workContext) => ({ workContext }));
  while (queue.length) {
    const item = queue.shift();
    if (!item) {
      continue;
    }
    const { parent, workContext } = item;
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
  contextItems?: ContextItem[];
  onAdd: (item: ContextItem) => void;
  onRemove: (type: string, uid: string) => void;
  disabled?: boolean;
  ignore?: (key: string, workContext: WorkContextOptions) => boolean;
}> = ({ contextItems, onAdd, onRemove, disabled, ignore }) => {
  const t = useT();
  const app = useApp();
  const ctx = useFlowContext();
  const plugin = app.pm.get('ai') as AIPluginLike | undefined;
  const workContext = plugin?.aiManager?.workContext;
  const { syncContextAttachments } = useChatMessageActions();

  const [items, onClick] = useMemo(() => {
    const context = Array.from(workContext?.getValues() || []);
    const menuItems: MenuProps['items'] = [];
    const menuItemMapping = new Map<string, NonNullable<MenuProps['items']>[number]>();
    const contextItemMapping = new Map<string, WorkContextOptions>();

    walkthrough(context, (parent, contextItem) => {
      if (!contextItem.menu) {
        return;
      }
      const key = parent ? `${parent}.${contextItem.name}` : contextItem.name || '';
      if (!key || (ignore?.(key, contextItem) ?? false)) {
        return;
      }

      const C = contextItem.menu.Component;
      const item: NonNullable<MenuProps['items']>[number] = {
        key,
        label: C ? <C /> : contextItem.menu.label ? t(String(contextItem.menu.label)) : key,
        icon: contextItem.menu.icon,
      };

      if (contextItem.name) {
        menuItemMapping.set(contextItem.name, item);
      }
      contextItemMapping.set(key, contextItem);
      if (parent && menuItemMapping.has(parent)) {
        const parentMenu = menuItemMapping.get(parent);
        if (parentMenu && 'children' in parentMenu) {
          parentMenu.children = [...(parentMenu.children || []), item];
        }
      } else {
        menuItems.push(item);
      }
    });

    const handleClick: MenuProps['onClick'] = (event) => {
      const key = String(event.key);
      const workContextItem = contextItemMapping.get(key);
      workContextItem?.menu?.onClick?.({
        ctx,
        contextItems,
        onAdd: (contextItem) => {
          const nextItem = {
            type: key,
            ...contextItem,
          };
          syncContextAttachments(nextItem);
          onAdd(nextItem);
        },
        onRemove: (uid: string) => {
          onRemove(key, uid);
        },
      });
    };

    return [menuItems, handleClick] as const;
  }, [contextItems, ctx, ignore, onAdd, onRemove, syncContextAttachments, t, workContext]);

  return (
    <Dropdown menu={{ items, onClick }} placement="topLeft" disabled={disabled || !items.length}>
      <Button type="text" icon={<AppstoreAddOutlined />} disabled={disabled || !items.length} />
    </Dropdown>
  );
};

AddContextButton.displayName = 'AddContextButton';
