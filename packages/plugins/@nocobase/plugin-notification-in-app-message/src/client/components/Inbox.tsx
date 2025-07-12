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

import { reaction } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import { Icon, useCurrentUserContext, useMobileLayout } from '@nocobase/client';
import { MobilePopup } from '@nocobase/plugin-mobile/client';
import { Badge, Button, ConfigProvider, Drawer, notification, theme, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useLocalTranslation } from '../../locale';
import { Channel } from '../../types';
import {
  fetchChannels,
  inboxVisible,
  liveSSEObs,
  messageMapObs,
  selectedChannelNameObs,
  startMsgSSEStreamWithRetry,
  unreadMsgsCountObs,
  updateUnreadMsgsCount,
  userIdObs,
} from '../observables';
import { InboxContent } from './InboxContent';
import { MobileChannelPage } from './mobile/ChannelPage';
import { MobileMessagePage } from './mobile/MessagePage';
const useStyles = createStyles(({ token }) => {
  return {
    button: {
      // @ts-ignore
      color: token.colorTextHeaderMenu + ' !important',
    },
  };
});

const InboxPopup: FC<{ title: string; visible: boolean; onClose: () => void }> = (props) => {
  const { token } = theme.useToken();
  const { isMobileLayout } = useMobileLayout();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  if (isMobileLayout) {
    return (
      <>
        <MobilePopup title={props.title} visible={props.visible} onClose={props.onClose} minHeight={'60vh'}>
          <MobileChannelPage displayNavigationBar={false} onClickItem={setSelectedChannel} />
        </MobilePopup>
        <MobilePopup
          title={selectedChannel?.title}
          visible={props.visible && !!selectedChannel}
          onClose={() => setSelectedChannel(null)}
          minHeight={'60vh'}
        >
          <MobileMessagePage displayPageHeader={false} />
        </MobilePopup>
      </>
    );
  }

  return (
    <Drawer
      title={<div style={{ padding: '0', paddingLeft: token.padding }}>{props.title}</div>}
      open={props.visible}
      width={900}
      onClose={props.onClose}
      styles={{
        header: {
          paddingLeft: token.paddingMD,
        },
      }}
    >
      <InboxContent />
    </Drawer>
  );
};

const InnerInbox = (props) => {
  const { t } = useLocalTranslation();
  const { styles } = useStyles();
  const ctx = useCurrentUserContext();
  const currUserId = ctx.data?.data?.id;
  const { token } = theme.useToken();

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
        <Button className={styles.button} onClick={onIconClick}>
          <Badge count={unreadMsgsCountObs.value} size="small">
            <Icon type={'BellOutlined'} />
          </Badge>
        </Button>
      </Tooltip>
      <InboxPopup
        title={t('Message')}
        visible={inboxVisible.value}
        onClose={() => {
          inboxVisible.value = false;
        }}
      />
    </ConfigProvider>
  );
};
export const Inbox = observer(InnerInbox);
