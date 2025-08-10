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
        <div style={{ width: 'fit-content' }}>
          <style>
            {`
              .variable-trigger-popover {
                width: fit-content !important;
              }
              .variable-trigger-popover .ant-popover-content,
              .variable-trigger-popover .ant-popover-inner {
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                width: fit-content !important;
              }
              .variable-trigger-popover .ant-popover-arrow { display: none !important; }
              .variable-trigger-popover .ant-cascader-menu { 
                max-height: 50vh !important; 
                overflow-y: auto !important; 
                width: auto !important; 
                min-width: auto !important; 
              }
              .variable-trigger-popover .ant-cascader-menus { width: fit-content !important; }
            `}
          </style>
          <FlowContextSelector
            metaTree={metaTree}
            onChange={handleVariableSelect}
            open={true}
            showSearch={false}
            dropdownStyle={{ boxShadow: 'none', border: 'none' }}
            style={{ display: 'none' }}
          >
            <div />
          </FlowContextSelector>
        </div>
      }
      open={open}
      trigger="click"
      placement="bottomLeft"
      onOpenChange={handleOpenChange}
      overlayClassName="variable-trigger-popover"
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
        {'{{}}'}
        <span style={{ display: 'none' }}>{children}</span>
      </span>
    </Popover>
  );
};
