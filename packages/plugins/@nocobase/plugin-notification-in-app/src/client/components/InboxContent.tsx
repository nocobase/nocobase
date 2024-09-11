/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Layout, List, Card, Descriptions, Typography, Badge, Button, Flex } from 'antd';
import type { Group as MsgGroup } from './hooks/useChat';
import { css } from '@emotion/css';
import { dayjs } from '@nocobase/utils/client';

export const InboxContent = ({
  groups,
  groupMap,
  onGroupClick,
  fetchChats,
}: {
  groups: Array<MsgGroup>;
  groupMap: Record<string, MsgGroup>;
  onGroupClick: (groupId: string) => any;
  fetchChats: (params: any) => any;
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(null);
  const selectedGroup = groupMap[selectedGroupId];
  const messages = useMemo(() => {
    if (!selectedGroupId) {
      return [];
    }
    const msgMap = groups.find((group) => group.id === selectedGroupId).msgMap;
    return Object.values(msgMap).sort((a, b) => (a.receiveTimestamp > b.receiveTimestamp ? -1 : 1));
  }, [groups, selectedGroupId]);

  const onLoadChannelsMore = () => {
    const filter: Record<string, any> = {};
    const lastGroup = groups[groups.length - 1];
    const latestMsgReceiveTimestamp = lastGroup && lastGroup.latestMsgReceiveTimestamp;
    if (latestMsgReceiveTimestamp) {
      filter.latestMsgReceiveTimestamp = {
        $lt: latestMsgReceiveTimestamp,
      };
    }
    fetchChats({ filter });
  };
  const loadChannelsMore = (
    <div
      style={{
        textAlign: 'center',
        marginTop: 12,
        height: 32,
        lineHeight: '32px',
      }}
    >
      <Button onClick={onLoadChannelsMore}>Loading more</Button>
    </div>
  );

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
              <Descriptions.Item label="时间">
                {dayjs(message.receiveTimestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ))}
      </>
    );
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Layout.Sider width={400} style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
        <List
          itemLayout="horizontal"
          dataSource={groups}
          loadMore={loadChannelsMore}
          style={{ paddingBottom: '20px' }}
          renderItem={(item) => (
            <List.Item
              className={css`
                &:hover {
                  background-color: #e4e5e6};
                }
              `}
              style={{
                paddingLeft: '12px',
                backgroundColor: selectedGroupId === item.id ? '#e4e5e6' : null,
                cursor: 'pointer',
              }}
              onClick={() => {
                setSelectedGroupId(item.id);
                onGroupClick(item.id);
              }}
            >
              <List.Item.Meta
                title={
                  <Flex justify="space-between">
                    <div style={{ width: '100px', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div
                      style={{
                        float: 'right',
                        fontWeight: 400,
                        color: 'rgba(0, 0, 0, 0.45)',
                        paddingRight: 12,
                      }}
                    >
                      {dayjs(item.latestMsgReceiveTimestamp).format('MM-DD HH:mm:ss')}
                    </div>
                  </Flex>
                }
                description={item.latestMsgTitle}
              />
              <Badge offset={[-10, 22]} count={item.unreadMsgCnt}></Badge>
            </List.Item>
          )}
        />
      </Layout.Sider>
      <Layout.Content style={{ padding: '0 24px 30px 24px', height: '100%', overflowY: 'auto' }}>
        {selectedGroupId ? <MessageList /> : null}
      </Layout.Content>
    </Layout>
  );
};
