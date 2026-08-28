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
    const serializable = toSerializable(content, new WeakSet<object>());
    return JSON.stringify(serializable, null, 2);
  } catch {
    return typeof content === 'object' ? '{}' : String(content);
  }
}

function toSerializable(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') {
    return undefined;
  }
  if (value == null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (seen.has(value)) {
    return undefined;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => {
      try {
        return toSerializable(item, seen);
      } catch {
        return undefined;
      }
    });
  }
  if (value instanceof Map) {
    try {
      return Object.fromEntries(
        Array.from(value.entries()).map(([key, mapValue]) => [String(key), toSerializable(mapValue, seen)]),
      );
    } catch {
      return {};
    }
  }
  if (value instanceof Set) {
    try {
      return Array.from(value.values()).map((item) => toSerializable(item, seen));
    } catch {
      return [];
    }
  }

  const result: Record<string, unknown> = {};
  let keys: string[];
  try {
    keys = Object.keys(value);
  } catch {
    return result;
  }
  keys.forEach((key) => {
    let child: unknown;
    try {
      child = (value as Record<string, unknown>)[key];
    } catch {
      return;
    }
    let serializableChild: unknown;
    try {
      serializableChild = toSerializable(child, seen);
    } catch {
      return;
    }
    if (typeof serializableChild !== 'undefined') {
      result[key] = serializableChild;
    }
  });
  return result;
}
