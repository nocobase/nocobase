/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Tag, Modal, Typography } from 'antd';
import { ContextItem as ContextItemType } from '../types';
import { useChatMessages } from './ChatMessagesProvider';
import PluginAIClient from '../..';
import { usePlugin } from '@nocobase/client';
const { Paragraph } = Typography;

export const ContextItem: React.FC<{
  item: ContextItemType;
  closable?: boolean;
}> = ({ item, closable }) => {
  const [showContent, setShowContent] = React.useState(false);
  const { removeContextItem } = useChatMessages();
  const plugin = usePlugin('ai') as PluginAIClient;
  const workContext = plugin.aiManager.workContext;
  const C = useMemo(() => {
    const [rootKey, childKey] = item.type.split('.');
    if (!childKey) {
      return workContext.get(rootKey)?.tag?.Component;
    }
    const root = workContext.get(rootKey);
    if (!root?.children) {
      return;
    }
    return root.children[childKey]?.tag?.Component;
  }, [item.type, workContext]);
  return (
    <>
      <Tag
        onClick={() => setShowContent(true)}
        closable={closable}
        onClose={() => {
          removeContextItem(item.type, item.uid);
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        {C ? <C item={item} /> : item.title}
      </Tag>
      <Modal open={showContent} onCancel={() => setShowContent(false)} footer={null} width="50%">
        <Paragraph>
          <pre
            style={{
              maxHeight: '70vh',
              overflowY: 'auto',
              marginTop: '24px',
            }}
          >
            {item.content}
          </pre>
        </Paragraph>
      </Modal>
    </>
  );
};
