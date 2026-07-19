/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BasePageMenuModel } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import React, { useEffect } from 'react';
import { InboxContent } from '../components/InboxContent';
import { MobileNotificationContent } from '../components/MobileNotificationContent';
import { tExpr } from '../locale';
import { fetchChannels, userIdObs } from '../state';

type NotificationPageFlowContext = {
  user?: {
    id?: unknown;
  };
};

function normalizeUserId(value: unknown) {
  if (value == null || value === '') return null;
  const userId = Number(value);
  return Number.isFinite(userId) ? userId : null;
}

function DesktopNotificationPageContent() {
  const ctx = useFlowContext() as NotificationPageFlowContext;
  const currentUserId = normalizeUserId(ctx.user?.id);

  useEffect(() => {
    userIdObs.value = currentUserId;
    fetchChannels({ limit: 30 }).catch((error) => {
      console.error('Failed to fetch notification channels on page open', error);
    });
  }, [currentUserId]);

  return (
    <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <InboxContent />
    </div>
  );
}

function MobileNotificationPageContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <MobileNotificationContent />
    </div>
  );
}

export class NotificationPageMenuModel extends BasePageMenuModel {
  render() {
    return this.context.isMobileLayout ? <MobileNotificationPageContent /> : <DesktopNotificationPageContent />;
  }
}

NotificationPageMenuModel.define({
  icon: 'BellOutlined',
  label: tExpr('Notification'),
  routeType: 'notification',
  sort: 310,
});

export default NotificationPageMenuModel;
