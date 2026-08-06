/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel } from '@nocobase/client-v2';
import React from 'react';
import { MobileNotificationContent } from '../components/MobileNotificationContent';
import { tExpr } from '../locale';

function NotificationEmbeddedPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <MobileNotificationContent />
    </div>
  );
}

export class NotificationEmbeddedPageModel extends ChildPageModel {
  onInit(options: Parameters<ChildPageModel['onInit']>[0]) {
    super.onInit(options);
    this.setProps('showFlowSettings', false);
  }

  render() {
    return <NotificationEmbeddedPage />;
  }

  renderFirstTab() {
    return <NotificationEmbeddedPage />;
  }
}

NotificationEmbeddedPageModel.define({
  hide: true,
  label: tExpr('Notification'),
});

export default NotificationEmbeddedPageModel;
