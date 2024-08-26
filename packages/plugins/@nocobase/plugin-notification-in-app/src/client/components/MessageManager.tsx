/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { css } from '@emotion/css';
import { MailOutlined } from '@ant-design/icons';
import { Badge, Button, ConfigProvider } from 'antd';
import { Drawer } from 'antd';
import { createStyles } from 'antd-style';
import { Icon } from '@nocobase/client';

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
  const { styles } = useStyles();
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
