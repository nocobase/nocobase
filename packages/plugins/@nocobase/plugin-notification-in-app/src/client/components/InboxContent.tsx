/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Layout, List, Card, Descriptions, Typography, Badge } from 'antd';
import type { Group as MsgGroup } from './hooks/useChat';
export const InboxContent = ({
  groups,
  groupMap,
  onGroupClick,
}: {
  groups: Array<MsgGroup>;
  groupMap: Record<string, MsgGroup>;
  onGroupClick: (groupId: string) => any;
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(null);
  const selectedGroup = groupMap[selectedGroupId];
  const messages = useMemo(() => {
    if (!selectedGroupId) {
      return [];
    }
    const msgMap = groups.find((group) => group.id === selectedGroupId).msgMap;
    return Object.values(msgMap).sort((a, b) => (a.receiveTime > b.receiveTime ? -1 : 1));
  }, [groups, selectedGroupId]);

  const MessageList = () => {
    return (
      <>
        <Typography.Title level={4} style={{ marginTop: 12 }}>
          {selectedGroup.title}
        </Typography.Title>

        {messages.map((message, index) => (
          <Card size={'small'} style={{ marginTop: 24 }} title={message.title} key={message.id}>
            <Descriptions key={index} column={1}>
              <Descriptions.Item label="内容">{message.content}</Descriptions.Item>
              <Descriptions.Item label="时间">{message.receiveTime}</Descriptions.Item>
            </Descriptions>
          </Card>
        ))}
      </>
    );
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Layout.Sider width={300} style={{ height: '100vh', overflowY: 'auto', background: '#fff' }}>
        <List
          itemLayout="horizontal"
          dataSource={groups}
          renderItem={(item) => (
            <List.Item
              style={{ paddingLeft: '12px' }}
              onClick={() => {
                setSelectedGroupId(item.id);
                onGroupClick(item.id);
              }}
            >
              <List.Item.Meta
                title={
                  <div>
                    {item.title}
                    <span
                      style={{
                        float: 'right',
                        fontWeight: 400,
                        color: 'rgba(0, 0, 0, 0.45)',
                        paddingRight: 12,
                      }}
                    >
                      {item.lastMsgReceiveTime}
                    </span>
                  </div>
                }
                description={'description'}
              />
              <Badge offset={[-10, 22]} count={item.unreadMsgCnt}></Badge>
            </List.Item>
          )}
        />
      </Layout.Sider>
      <Layout.Content style={{ padding: '0 24px', minHeight: 280 }}>
        {selectedGroupId ? <MessageList /> : null}
      </Layout.Content>
    </Layout>
  );
};
