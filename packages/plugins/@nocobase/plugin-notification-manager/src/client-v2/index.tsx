/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default } from './plugin';
export { PluginNotificationManagerClientV2 } from './plugin';
export { default as NotificationManager } from './notification-manager';
export type {
  RegisterChannelOptions,
  LoaderOf,
  MessageConfigFormProps,
  ContentConfigFormProps,
} from './notification-manager';
export { MessageConfigForm } from './components/MessageConfigForm';
export { ContentConfigForm } from './components/ContentConfigForm';
export { UserSelect, UserAddition } from './components/User';
