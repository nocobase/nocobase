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

import { observer } from '@formily/reactive-react';
import { Icon, useApp, useCurrentUserContext, useMobileLayout } from '@nocobase/client';
import { MobilePopup } from '@nocobase/plugin-mobile/client';
import { Badge, Button, ConfigProvider, Drawer, notification, theme, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useLocalTranslation } from '../../locale';
import { Channel } from '../../types';
import {
  fetchChannels,
  inboxVisible,
  messageMapObs,
  selectedChannelNameObs,
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
  const app = useApp();
  const { t } = useLocalTranslation();
  const { styles } = useStyles();
  const ctx = useCurrentUserContext();
  const currUserId = ctx.data?.data?.id;

  const onMessageCreated = useCallback(({ detail }: CustomEvent) => {
    notification.info({
      message: (
        <div
          style={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {detail.title}
        </div>
      ),
      description: detail.content.slice(0, 100) + (detail.content.length > 100 ? '...' : ''),
      onClick: () => {
        inboxVisible.value = true;
        selectedChannelNameObs.value = detail.channelName;
        notification.destroy();
      },
    });
  }, []);

  const onMessageUpdated = useCallback(({ detail }: CustomEvent) => {
    messageMapObs.value[detail.id] = detail;
    fetchChannels({ filter: { name: detail.channelName } });
    updateUnreadMsgsCount();
  }, []);

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
    app.eventBus.addEventListener('ws:message:in-app-message:created', onMessageCreated);
    app.eventBus.addEventListener('ws:message:in-app-message:updated', onMessageUpdated);

    return () => {
      app.eventBus.removeEventListener('ws:message:in-app-message:created', onMessageCreated);
      app.eventBus.removeEventListener('ws:message:in-app-message:updated', onMessageUpdated);
    };
  }, [app.eventBus, onMessageUpdated]);

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
