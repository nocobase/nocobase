/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, openViewFlow } from '@nocobase/client-v2';
import { observable } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { tExpr } from '../locale';
import { subscribeInAppUnreadCount, type InAppUnreadCountSubscription } from '../service';
import { inboxVisibleObs } from '../state';

const NOTIFICATION_EMBEDDED_PAGE_MODEL = 'NotificationEmbeddedPageModel';

type ActionPanelBadgeOptions = {
  count?: number | string;
  overflowCount?: number;
};

export class NotificationEntryActionModel extends ActionModel {
  private readonly actionPanelBadgeState = observable<{ value: ActionPanelBadgeOptions | null }>({
    value: null,
  });
  private unreadCountSubscription?: InAppUnreadCountSubscription;

  defaultProps: ButtonProps = {
    title: tExpr('Notification'),
    icon: 'BellOutlined',
  };

  enableEditType = false;
  enableEditDanger = false;
  enableEditIconOnly = false;

  get actionPanelBadge() {
    return this.actionPanelBadgeState.value;
  }

  set actionPanelBadge(value: ActionPanelBadgeOptions | null) {
    this.actionPanelBadgeState.value = value;
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    this.syncOpenViewStepParams();
  }

  protected onMount(): void {
    super.onMount();
    this.subscribeUnreadCount();
  }

  protected onUnmount(): void {
    this.unreadCountSubscription?.unsubscribe();
    this.unreadCountSubscription = undefined;
    super.onUnmount();
  }

  async onClick(event?: unknown) {
    if (this.context.isMobileLayout) {
      await this.dispatchEvent(
        'click',
        {
          event,
          isMobileLayout: true,
          pageModelClass: NOTIFICATION_EMBEDDED_PAGE_MODEL,
          showFlowSettings: false,
        },
        {
          debounce: true,
        },
      );
      return;
    }

    inboxVisibleObs.value = true;
  }

  private syncOpenViewStepParams() {
    const params = this.getStepParams('popupSettings', 'openView') || {};
    this.setStepParams('popupSettings', 'openView', {
      ...params,
      mode: 'embed',
      pageModelClass: NOTIFICATION_EMBEDDED_PAGE_MODEL,
      showFlowSettings: false,
    });
  }

  private subscribeUnreadCount() {
    this.unreadCountSubscription?.unsubscribe();
    this.unreadCountSubscription = subscribeInAppUnreadCount({
      eventBus: this.context.app?.eventBus,
      onChange: (unreadCount) => {
        this.actionPanelBadge = unreadCount > 0 ? { count: unreadCount, overflowCount: 99 } : null;
      },
      onError: (error) => {
        console.error('Failed to update in-app unread count', error);
      },
    });
  }
}

NotificationEntryActionModel.define({
  label: tExpr('Notification'),
});

NotificationEntryActionModel.registerFlow(openViewFlow);

export default NotificationEntryActionModel;
