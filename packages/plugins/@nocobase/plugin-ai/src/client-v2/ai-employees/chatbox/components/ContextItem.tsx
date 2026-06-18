/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Tag, Typography } from 'antd';
import { useApp } from '@nocobase/client-v2';
import type { ContextItem as ContextItemType } from '../../types';

const { Paragraph } = Typography;

type WorkContextApplication = ReturnType<typeof useApp>;

type WorkContextOptions = {
  tag?: {
    Component?: React.ComponentType<{ item: ContextItemType }>;
  };
  chatbox?: {
    Component?: React.ComponentType<{ item: ContextItemType }>;
  };
  getContent?: (app: WorkContextApplication, item: ContextItemType) => Promise<unknown>;
};

type AIPluginLike = {
  aiManager?: {
    getWorkContext?: (type: string) => WorkContextOptions | undefined;
  };
};

export const ContextItem: React.FC<{
  item: ContextItemType;
  closable?: boolean;
  onRemove?: (type: string, uid: string) => void;
  within: 'sender' | 'chatbox' | 'task';
}> = ({ item, closable, onRemove, within }) => {
  const app = useApp();
  const [showContent, setShowContent] = useState(false);
  const [text, setText] = useState('');
  const options = useMemo(() => {
    const plugin = app.pm.get('ai') as AIPluginLike | undefined;
    return plugin?.aiManager?.getWorkContext?.(item.type);
  }, [app.pm, item.type]);
  const TagComponent = options?.tag?.Component;

  useEffect(() => {
    const readContent = async () => {
      if (options?.getContent) {
        const content = await options.getContent(app, item);
        setText(stringifyContent(content));
        return;
      }
      setText(stringifyContent(item.content));
    };

    readContent().catch(() => {
      setText(stringifyContent(item.content));
    });
  }, [app, item, options]);

  if (within === 'chatbox' && options?.chatbox?.Component) {
    return <options.chatbox.Component item={item} />;
  }

  return (
    <>
      <Tag
        closable={closable}
        onClick={() => {
          setShowContent(true);
        }}
        onClose={() => {
          onRemove?.(item.type, item.uid);
        }}
        style={{
          cursor: 'pointer',
          whiteSpace: 'normal',
        }}
      >
        {TagComponent ? <TagComponent item={item} /> : item.title || item.uid}
      </Tag>
      <Modal open={showContent} onCancel={() => setShowContent(false)} footer={null} width="50%">
        <Paragraph
          copyable={{
            text,
          }}
        >
          <pre
            style={{
              minHeight: '35vh',
              maxHeight: '70vh',
              overflowY: 'auto',
              marginTop: 24,
            }}
          >
            {text}
          </pre>
        </Paragraph>
      </Modal>
    </>
  );
};

function stringifyContent(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }
  if (content == null) {
    return '';
  }
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}
