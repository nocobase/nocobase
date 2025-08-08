/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Popover } from 'antd';
import { RenderElementProps } from 'slate-react';
import { FlowContextSelector } from '../FlowContextSelector';
import type { ContextSelectorItem, VariableTriggerElement } from './types';
import type { MetaTreeNode } from '../../flowContext';

interface VariableTriggerProps extends RenderElementProps {
  element: VariableTriggerElement;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  onVariableSelect?: (triggerId: string, value: string, item: ContextSelectorItem) => void;
  onTriggerClose?: (triggerId: string) => void;
}

export const VariableTrigger: React.FC<VariableTriggerProps> = ({
  attributes,
  children,
  element,
  metaTree,
  onVariableSelect,
  onTriggerClose,
}) => {
  const [open, setOpen] = useState(true);

  const handleVariableSelect = (value: string, item?: ContextSelectorItem) => {
    if (item) {
      setOpen(false);
      onVariableSelect?.(element.triggerId, value, item);
    }
  };

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      setOpen(false);
      onTriggerClose?.(element.triggerId);
    }
  };

  return (
    <Popover
      content={
        <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
          <FlowContextSelector metaTree={metaTree} onChange={handleVariableSelect} open={true} showSearch={true} />
        </div>
      }
      open={open}
      trigger="click"
      placement="bottomLeft"
      onOpenChange={handleOpenChange}
      overlayStyle={{ zIndex: 1050 }}
      destroyTooltipOnHide
    >
      <span
        {...attributes}
        contentEditable={false}
        style={{
          backgroundColor: '#e6f7ff',
          border: '1px dashed #1890ff',
          borderRadius: 4,
          padding: '1px 4px',
          margin: '0 1px',
          cursor: 'pointer',
          display: 'inline-block',
          fontSize: '12px',
          color: '#1890ff',
          userSelect: 'none',
        }}
        data-slate-void={true}
      >
        {'{{'}
        {children}
      </span>
    </Popover>
  );
};
