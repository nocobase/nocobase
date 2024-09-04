/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { Badge, Button, ConfigProvider } from 'antd';
import { Drawer } from 'antd';
import { createStyles } from 'antd-style';
import { Icon } from '@nocobase/client';
import { useAPIClient } from '@nocobase/client';

import MessageBox from './MessageBox';
const useStyles = createStyles(({ token }) => {
  return {
    button: {
      // @ts-ignore
      color: token.colorTextHeaderMenu + ' !important',
    },
  };
});

export const MessageManager = (props) => {
  const [visible, setVisible] = useState(false);
  const apiClient = useAPIClient();
  const baseURL = apiClient.axios.defaults.baseURL;
  const { styles } = useStyles();
  useEffect(() => {
    const request = async () => {
      const res = await apiClient.request({
        url: 'inAppMessages:sse',
        method: 'get',
        headers: {
          Accept: 'text/event-stream',
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
          console.log(value);
        } catch (error) {
          console.error(error);
          break;
        }
      }
    };
    request();
  }, [apiClient]);
  const onOpen = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };
  return (
    <ConfigProvider
      theme={{
        components: { Drawer: { paddingLG: 0 } },
      }}
    >
      <Button className={styles.button} title={'Apps'} icon={<Icon type={'MailOutlined'} />} onClick={onOpen} />
      <Badge count={5} size="small" offset={[-18, -16]}></Badge>

      <Drawer title={'站内信'} open={visible} onClose={onClose} size="large">
        <MessageBox message={'111'} />
      </Drawer>
    </ConfigProvider>
  );
};
