/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bubble } from '@ant-design/x';
import { Spin, Layout, Divider, Button } from 'antd';
import { RightOutlined, DownOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { useToken } from '@nocobase/client';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatToolsStore } from './stores/chat-tools';
import { flattenMessages, formatConversationDuration, RenderedItem } from './utils';

export const Messages: React.FC = () => {
  const t = useT();
  const { token } = useToken();

  const roles = useChatBoxStore.use.roles();

  const messages = useChatMessagesStore.use.messages();

  const updateTools = useChatToolsStore.use.updateTools();

  const { messagesService, lastMessageRef } = useChatMessageActions();
  const renderedMessages = useMemo(() => flattenMessages(messages), [messages]);
  const [collapsedConversationKeys, setCollapsedConversationKeys] = useState<Record<string, boolean>>({});
  const firstMessageIndex = renderedMessages.findIndex(
    (item) => item.type === 'message' && item.isRoot && item.message.content?.type !== 'greeting',
  );

  useEffect(() => {
    updateTools(messages);
  }, [messages, updateTools]);

  useEffect(() => {
    setCollapsedConversationKeys((prev) => {
      const next = { ...prev };
      let changed = false;

      const collectCompletedConversations = (items: RenderedItem[]) => {
        items.forEach((item) => {
          if (item.type !== 'conversation-group') {
            return;
          }

          if (item.status === 'completed' && !(item.key in next)) {
            next[item.key] = false;
            changed = true;
          }

          collectCompletedConversations(item.items);
        });
      };

      collectCompletedConversations(renderedMessages);

      return changed ? next : prev;
    });
  }, [renderedMessages]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const resizeObserver = new ResizeObserver(() => {
      container.scrollTop = container.scrollHeight;
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [messages]);

  const renderConversationToggleDivider = (
    item: Extract<RenderedItem, { type: 'conversation-group' }>,
    collapsed: boolean,
  ) => {
    const durationText = formatConversationDuration(item.durationMs);

    return (
      <Divider
        key={`${item.key}-divider-top`}
        dashed
        plain
        style={{
          margin: '0 0 8px 0',
          color: token.colorTextDescription,
        }}
      >
        <Button
          type="link"
          size="small"
          onClick={() =>
            setCollapsedConversationKeys((prev) => ({
              ...prev,
              [item.key]: !collapsed,
            }))
          }
          style={{
            paddingInline: 0,
            color: token.colorTextDescription,
          }}
          icon={collapsed ? <RightOutlined /> : <DownOutlined />}
          iconPosition="end"
        >
          {t('Done in {{ durationText }}', { durationText })}
        </Button>
      </Divider>
    );
  };

  const renderConversationCompletedDivider = (item: Extract<RenderedItem, { type: 'conversation-group' }>) => {
    const nickname = item.roleName ? (roles[item.roleName] as any)?.nickname || item.roleName : undefined;

    return (
      <Divider
        key={`${item.key}-divider-bottom`}
        dashed
        plain
        style={{
          margin: '0 0 8px 0',
          color: token.colorTextDescription,
        }}
      >
        {t('{{ nickname }} has completed the work', { nickname })}
      </Divider>
    );
  };

  const renderItem = (item: RenderedItem, indexPath: string) => {
    if (item.type === 'conversation-group') {
      const collapsed = item.status === 'completed' ? collapsedConversationKeys[item.key] !== false : false;

      if (collapsed) {
        return renderConversationToggleDivider(item, true);
      }

      return (
        <React.Fragment key={item.key}>
          {item.status === 'completed' ? renderConversationToggleDivider(item, false) : null}
          {item.items.map((child, childIndex) => renderItem(child, `${indexPath}-${childIndex}`))}
          {item.status === 'completed' ? renderConversationCompletedDivider(item) : null}
        </React.Fragment>
      );
    }

    const msg = item.message;
    const role = roles[msg.role];
    if (!role) {
      return null;
    }

    return indexPath === String(firstMessageIndex) ? (
      <div key={msg.key} ref={lastMessageRef}>
        <Bubble {...role} loading={msg.loading} content={msg.content} />
      </div>
    ) : (
      <Bubble {...role} key={msg.key} loading={msg.loading} content={msg.content} />
    );
  };

  return (
    <Layout.Content
      ref={containerRef}
      style={{
        margin: '16px 0',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {messagesService.loading && (
        <Spin
          style={{
            display: 'block',
            margin: '8px auto',
          }}
        />
      )}
      {renderedMessages.length ? (
        <div>{renderedMessages.map((item, index) => renderItem(item, String(index)))}</div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: token.colorTextDescription,
          }}
        >
          {t('Work with your AI crew')}
        </div>
      )}
    </Layout.Content>
  );
};
