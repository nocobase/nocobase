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
import { List, Badge, Card } from 'antd-mobile';
import { channelListObs } from '../../observables';
const InternalChannelList = () => {
  return (
    <>
      <List>
        {channelListObs.value.map((item) => {
          return (
            <Card
              key={item.name}
              onClick={() => {}}
              title={item.title}
              extra={<Badge style={{ border: 'none' }} content={item.unreadMsgCnt}></Badge>}
            >
              {item.content}
            </Card>
          );
        })}
      </List>
    </>
  );
};

export const ChannelList = observer(InternalChannelList, { displayName: 'ChannelList' });
