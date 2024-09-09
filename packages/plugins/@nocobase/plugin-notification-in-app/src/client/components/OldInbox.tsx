/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please rwefer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Button, ConfigProvider, notification } from 'antd';
import { createStyles } from 'antd-style';
import { Icon } from '@nocobase/client';
import { useAPIClient } from '@nocobase/client';
import { useNavigate } from 'react-router-dom';
import { NAMESPACE } from '..';
const useStyles = createStyles(({ token }) => {
  return {
    button: {
      // @ts-ignore
      color: token.colorTextHeaderMenu + ' !important',
    },
  };
});

export const Inbox = (props) => {
  const apiClient = useAPIClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const onIconClick = useCallback(() => {
    navigate(`/admin/settings/${NAMESPACE}`);
  }, [navigate]);

  const { styles } = useStyles();
  const updateUnreadCount = useCallback(async () => {
    const res = await apiClient.request({
      url: 'myInAppMessages:count',
      method: 'get',
      params: {
        status: 'unread',
      },
    });
    setUnreadCount(res.data.data.count);
  }, [apiClient]);
  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);
  useEffect(() => {
    const request = async () => {
      const res = await apiClient.request({
        url: 'myInAppMessages:sse',
        method: 'get',
        headers: {
          Accept: 'text/event-stream',
        },
        params: {
          id: crypto.randomUUID(),
        },
        responseType: 'stream',
        adapter: 'fetch',
      });
      const stream = res.data;
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const { value, done } = await reader.read();
          if (done) break;
          const data = JSON.parse(value.replace(/^data:\s*/, '').trim());
          notification.info({ message: data.title, description: data.content });
          updateUnreadCount();
        } catch (error) {
          console.error(error);
          break;
        }
      }
    };
    request();
  }, [apiClient]);
  return (
    <ConfigProvider
      theme={{
        components: { Drawer: { paddingLG: 0 } },
      }}
    >
      <Button className={styles.button} title={'Apps'} icon={<Icon type={'MailOutlined'} />} onClick={onIconClick} />
      {unreadCount > 0 && <Badge count={unreadCount} size="small" offset={[-18, -16]}></Badge>}
    </ConfigProvider>
  );
};
