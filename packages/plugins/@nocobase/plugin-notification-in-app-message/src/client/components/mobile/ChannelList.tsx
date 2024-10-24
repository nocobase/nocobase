/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@formily/reactive-react';
import { List, Badge } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { channelListObs, channelStatusFilterObs } from '../../observables';
const InternalChannelList = () => {
  const navigate = useNavigate();
  return (
    <>
      <List>
        {channelListObs.value.map((item) => {
          return (
            <List.Item
              key={item.name}
              onClick={() => {
                navigate(`/page/in-app-message/messages?channel=${item.name}`);
              }}
              description={item.latestMsgTitle}
              extra={
                <Badge
                  style={{ border: 'none' }}
                  content={channelStatusFilterObs.value !== 'read' && item.unreadMsgCnt > 0 ? item.unreadMsgCnt : null}
                ></Badge>
              }
            >
              {item.title}
            </List.Item>
          );
        })}
      </List>
    </>
  );
};

export const ChannelList = observer(InternalChannelList, { displayName: 'ChannelList' });
