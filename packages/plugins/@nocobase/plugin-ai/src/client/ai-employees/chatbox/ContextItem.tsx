/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Tag, Modal, Typography } from 'antd';
import { ContextItem as ContextItemType } from '../types';
import PluginAIClient from '../..';
import { useApp, usePlugin } from '@nocobase/client';
import _ from 'lodash';
const { Paragraph } = Typography;

export const ContextItem: React.FC<{
  item: ContextItemType;
  closable?: boolean;
  onRemove?: (type: string, uid: string) => void;
  within: 'sender' | 'chatbox' | 'task';
}> = ({ item, closable, onRemove, within }) => {
  const app = useApp();
  const [showContent, setShowContent] = React.useState(false);
  const plugin = usePlugin('ai') as PluginAIClient;
  const workContext = plugin.aiManager.workContext;
  const options = useMemo(() => {
    const [rootKey, childKey] = item.type.split('.');
    if (!childKey) {
      return workContext.get(rootKey);
    }
    const root = workContext.get(rootKey);
    if (!root?.children) {
      return;
    }
    return root.children[childKey];
  }, [item.type, workContext]);
  const C = options?.tag?.Component;
  const getContent = options?.getContent;

  const [text, setText] = useState('');
  useEffect(() => {
    if (getContent) {
      getContent(app, item)
        .then((content) => {
          setText(_.isString(content) ? content : JSON.stringify(content, null, 2));
        })
        .catch(() => {
          // ignore
        });
    } else {
      setText(_.isString(item.content) ? item.content : JSON.stringify(item.content, null, 2));
    }
  }, [app, getContent, item, showContent]);

  return (
    <>
      {within === 'chatbox' && options?.chatbox?.Component ? (
        <options.chatbox.Component item={item} />
      ) : (
        <Tag
          onClick={() => setShowContent(true)}
          closable={closable}
          onClose={() => {
            onRemove(item.type, item.uid);
          }}
          style={{
            cursor: 'pointer',
            whiteSpace: 'normal',
          }}
        >
          {C ? <C item={item} /> : item.title}
        </Tag>
      )}

      <Modal open={showContent} onCancel={() => setShowContent(false)} footer={null} width="50%">
        <Paragraph
          copyable={{
            text: text,
          }}
        >
          <pre
            style={{
              minHeight: '35vh',
              maxHeight: '70vh',
              overflowY: 'auto',
              marginTop: '24px',
            }}
          >
            {text}
          </pre>
        </Paragraph>
      </Modal>
    </>
  );
};
