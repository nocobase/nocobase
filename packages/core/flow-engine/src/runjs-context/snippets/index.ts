/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type EngineSnippetMap = Record<string, () => Promise<any>>;

export const engineSnippets: EngineSnippetMap = {
  // global
  'global/message-success': () => import('./global/message-success.snippet'),
  'global/message-error': () => import('./global/message-error.snippet'),
  'global/copy-to-clipboard': () => import('./global/copy-to-clipboard.snippet'),
  'global/copy-record-json': () => import('./global/copy-record-json.snippet'),
  'global/log-json-record': () => import('./global/log-json-record.snippet'),
  'global/api-request-get': () => import('./global/api-request-get.snippet'),
  'global/api-request-post': () => import('./global/api-request-post.snippet'),
  'global/requireAsync': () => import('./global/requireAsync.snippet'),
  'global/try-catch-async': () => import('./global/try-catch-async.snippet'),
  'global/sleep': () => import('./global/sleep.snippet'),
  'global/notification-open': () => import('./global/notification-open.snippet'),
  'global/window-open': () => import('./global/window-open.snippet'),
  'global/console-log-ctx': () => import('./global/console-log-ctx.snippet'),
  'global/open-view-drawer': () => import('./global/open-view-drawer.snippet'),
  'global/open-view-dialog': () => import('./global/open-view-dialog.snippet'),
  'global/view-navigation-push': () => import('./global/view-navigation-push.snippet'),
  // libs
  'libs/echarts-init': () => import('./libs/echarts-init.snippet'),
  // scene/jsblock
  'scene/jsblock/render-basic': () => import('./scene/jsblock/render-basic.snippet'),
  'scene/jsblock/render-react': () => import('./scene/jsblock/render-react.snippet'),
  'scene/jsblock/render-card': () => import('./scene/jsblock/render-card.snippet'),
  'scene/jsblock/render-button-handler': () => import('./scene/jsblock/render-button-handler.snippet'),
  'scene/jsblock/jsx-mount': () => import('./scene/jsblock/jsx-mount.snippet'),
  'scene/jsblock/jsx-unmount': () => import('./scene/jsblock/jsx-unmount.snippet'),
  'scene/jsblock/add-event-listener': () => import('./scene/jsblock/add-event-listener.snippet'),
  'scene/jsblock/append-style': () => import('./scene/jsblock/append-style.snippet'),
  // scene/jsfield
  'scene/jsfield/innerHTML-value': () => import('./scene/jsfield/innerHTML-value.snippet'),
  'scene/jsfield/format-number': () => import('./scene/jsfield/format-number.snippet'),
  'scene/jsfield/color-by-value': () => import('./scene/jsfield/color-by-value.snippet'),
  // scene/jsitem
  'scene/jsitem/render-basic': () => import('./scene/jsitem/render-basic.snippet'),
  // scene/actions
  'scene/actions/record-id-message': () => import('./scene/actions/record-id-message.snippet'),
  'scene/actions/run-action-basic': () => import('./scene/actions/run-action-basic.snippet'),
  'scene/actions/collection-selected-count': () => import('./scene/actions/collection-selected-count.snippet'),
  'scene/actions/iterate-selected-rows': () => import('./scene/actions/iterate-selected-rows.snippet'),
  // scene/linkage
  'scene/linkage/set-field-value': () => import('./scene/linkage/set-field-value.snippet'),
  'scene/linkage/toggle-visible': () => import('./scene/linkage/toggle-visible.snippet'),
  'scene/linkage/set-disabled': () => import('./scene/linkage/set-disabled.snippet'),
  'scene/linkage/set-required': () => import('./scene/linkage/set-required.snippet'),
};

export default engineSnippets;
