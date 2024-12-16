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

import React, { useEffect, useCallback } from 'react';
import { reaction } from '@formily/reactive';
import { Badge, Button, ConfigProvider, Drawer, Tooltip, notification } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import { Icon } from '@nocobase/client';
import { InboxContent } from './InboxContent';
import { useLocalTranslation } from '../../locale';
import { fetchChannels } from '../observables';
import { observer } from '@formily/reactive-react';
import { useCurrentUserContext } from '@nocobase/client';
import {
  updateUnreadMsgsCount,
  unreadMsgsCountObs,
  startMsgSSEStreamWithRetry,
  inboxVisible,
  userIdObs,
  liveSSEObs,
  messageMapObs,
  selectedChannelNameObs,
} from '../observables';
const useStyles = createStyles(({ token }) => {
  return {
    button: {
      // @ts-ignore
      color: token.colorTextHeaderMenu + ' !important',
    },
  };
});

const InnerInbox = (props) => {
  const { t } = useLocalTranslation();
  const { styles } = useStyles();
  const ctx = useCurrentUserContext();
  const currUserId = ctx.data?.data?.id;

  useEffect(() => {
    updateUnreadMsgsCount();
  }, []);

  useEffect(() => {
    userIdObs.value = currUserId ?? null;
  }, [currUserId]);
  const onIconClick = useCallback(() => {
    inboxVisible.value = true;
    fetchChannels({});
  }, []);

  useEffect(() => {
    const disposes: Array<() => void> = [];
    disposes.push(startMsgSSEStreamWithRetry());
    const disposeAll = () => {
      while (disposes.length > 0) {
        const dispose = disposes.pop();
        dispose && dispose();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        disposes.push(startMsgSSEStreamWithRetry());
      } else {
        disposeAll();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      disposeAll();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
  const DrawerTitle = <div style={{ padding: '0' }}>{t('Message')}</div>;
  const CloseIcon = (
    <div style={{ marginLeft: '15px' }}>
      <CloseOutlined />
    </div>
  );
  useEffect(() => {
    const dispose = reaction(
      () => liveSSEObs.value,
      (sseData) => {
        if (!sseData) return;

        if (['message:created', 'message:updated'].includes(sseData.type)) {
          const { data } = sseData;
          messageMapObs.value[data.id] = data;
          if (sseData.type === 'message:created') {
            notification.info({
              message: (
                <div
                  style={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {data.title}
                </div>
              ),
              description: data.content.slice(0, 100) + (data.content.length > 100 ? '...' : ''),
              onClick: () => {
                inboxVisible.value = true;
                selectedChannelNameObs.value = data.channelName;
                notification.destroy();
              },
            });
          }
        }
      },
    );
    return dispose;
  }, []);
  return (
    <ConfigProvider
      theme={{
        components: { Drawer: { paddingLG: 0 } },
      }}
    >
      <Tooltip title={t('Message')}>
        <Badge count={unreadMsgsCountObs.value} size="small" offset={[-12, 14]}>
          <Button
            className={styles.button}
            title={t('Message')}
            icon={<Icon type={'BellOutlined'} />}
            onClick={onIconClick}
          />
        </Badge>
      </Tooltip>
      <Drawer
        title={DrawerTitle}
        open={inboxVisible.value}
        closeIcon={CloseIcon}
        width={900}
        onClose={() => {
          inboxVisible.value = false;
        }}
      >
        <InboxContent />
      </Drawer>
    </ConfigProvider>
  );
};
export const Inbox = observer(InnerInbox);
