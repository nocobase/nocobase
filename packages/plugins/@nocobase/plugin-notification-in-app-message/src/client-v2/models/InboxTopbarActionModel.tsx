/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BellOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, tExpr, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Badge, Button, ConfigProvider, Drawer, Tooltip, notification, theme } from 'antd';
import React, { useEffect } from 'react';
import { TopbarActionModel, useCurrentUserContext, useMobileLayout } from '@nocobase/client-v2';
import { InboxContent } from '../components/InboxContent';
import { useInAppMessageTranslation } from '../locale';
import { subscribeInAppUnreadCount } from '../service';
import {
  fetchChannels,
  inboxVisibleObs,
  messageMapObs,
  selectedChannelNameObs,
  unreadMsgsCountObs,
  userIdObs,
} from '../state';

const NAMESPACE = 'notification-in-app-message';

type IncomingMessage = {
  id: string;
  channelName: string;
  title: string;
  content: string;
  options?: { duration?: number; url?: string };
  [key: string]: any;
};

// Faithful port of v1's `.ant-badge` block from
// `packages/core/client/src/plugin-manager/PinnedPluginListProvider.tsx`.
// v1's admin top bar pre-dates antd v5 tokens — this rule manually
// shrinks the unread-count badge so it sits compactly over the bell
// icon. v2's default antd small badge (~14/12 px) renders too large
// here; without this block the badge looks like a big red disk rather
// than a compact tag.
//
// This is intentionally a hardcoded-pixel exception (10/10/8) carried
// over from v1 for visual parity with the legacy bell. Do NOT generalise
// or fold into the shared `TopbarActionButton` styling — every other
// topbar action wants the antd-default badge size. Keep this rule
// scoped to the Inbox button only.
const inboxBadgeClassName = css`
  .ant-badge {
    color: rgba(255, 255, 255, 0.65);
    .anticon {
      display: inline-block;
      vertical-align: middle;
      line-height: 1em;
      font-size: initial;
    }
    > sup {
      height: 10px;
      line-height: 10px;
      font-size: 8px;
    }
  }
`;

const InboxButton = observer(
  ({ model }: { model: InboxTopbarActionModel }) => {
    const { t } = useInAppMessageTranslation();
    const flowEngine = useFlowEngine();
    const { isMobileLayout } = useMobileLayout();
    const { token } = theme.useToken();
    const userContext = useCurrentUserContext();
    const currentUserId = userContext?.data?.data?.id ?? null;

    const onIconClick = useMemoizedFn(() => {
      inboxVisibleObs.value = true;
    });

    const onClose = useMemoizedFn(() => {
      inboxVisibleObs.value = false;
    });

    const onMessageCreated = useMemoizedFn((event: Event) => {
      const detail = (event as CustomEvent<IncomingMessage>).detail;
      if (!detail) return;
      messageMapObs.value[detail.id] = detail as any;
      fetchChannels({ filter: { name: detail.channelName, status: 'all' } }).catch((error) => {
        console.error('Failed to refresh channel after message created', error);
      });

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
        description:
          (detail.content?.slice(0, 100) ?? '') + (detail.content && detail.content.length > 100 ? '...' : ''),
        onClick: () => {
          inboxVisibleObs.value = true;
          selectedChannelNameObs.value = detail.channelName;
          notification.destroy();
        },
        duration: detail.options?.duration,
      });
    });

    const onMessageUpdated = useMemoizedFn((event: Event) => {
      const detail = (event as CustomEvent<IncomingMessage>).detail;
      if (!detail) return;
      messageMapObs.value[detail.id] = detail as any;
      fetchChannels({ filter: { name: detail.channelName } }).catch((error) => {
        console.error('Failed to refresh channel after message updated', error);
      });
    });

    useEffect(() => {
      const app = flowEngine.context.app as any;
      const subscription = subscribeInAppUnreadCount({
        eventBus: app?.eventBus,
        onChange: (count) => {
          unreadMsgsCountObs.value = count;
        },
        onError: (error) => {
          console.error('Failed to update in-app unread count', error);
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    }, [flowEngine.context.app]);

    useEffect(() => {
      userIdObs.value = currentUserId ?? null;
    }, [currentUserId]);

    useEffect(() => {
      const app = flowEngine.context.app as any;
      if (!app?.eventBus) return;
      app.eventBus.addEventListener('ws:message:in-app-message:created', onMessageCreated);
      app.eventBus.addEventListener('ws:message:in-app-message:updated', onMessageUpdated);
      return () => {
        app.eventBus.removeEventListener('ws:message:in-app-message:created', onMessageCreated);
        app.eventBus.removeEventListener('ws:message:in-app-message:updated', onMessageUpdated);
      };
    }, [flowEngine.context.app, onMessageCreated, onMessageUpdated]);

    if (isMobileLayout) {
      return null;
    }

    const button = (
      <Tooltip title={model.context.t(model.tooltip)}>
        <Button type="text" onClick={onIconClick} data-testid={model.getTestId()} className={inboxBadgeClassName}>
          <Badge count={unreadMsgsCountObs.value ?? 0} size="small">
            <BellOutlined />
          </Badge>
        </Button>
      </Tooltip>
    );

    return (
      <ConfigProvider theme={{ components: { Drawer: { paddingLG: 0 } } }}>
        {button}
        <Drawer
          title={<div style={{ padding: 0, paddingLeft: token.padding }}>{t('Message')}</div>}
          open={inboxVisibleObs.value}
          width={900}
          onClose={onClose}
          styles={{ header: { paddingLeft: token.paddingMD } }}
        >
          <InboxContent />
        </Drawer>
      </ConfigProvider>
    );
  },
  { displayName: 'InboxButton' },
);

export class InboxTopbarActionModel extends TopbarActionModel {
  // Sort > PluginSettingsTopbarActionModel (100) so the bell renders
  // to the RIGHT of the gear icon, matching v1's PinnedPluginList
  // order (gear, then bell, then Help, then UserCenter).
  sort = 200;
  actionId = 'inbox';
  testId = 'inbox-button';
  tooltip = tExpr('Message', { ns: [NAMESPACE, '@nocobase/plugin-notification-in-app-message', 'client'] });

  render() {
    return <InboxButton model={this} />;
  }
}

export default InboxTopbarActionModel;
