/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type PluginNotificationManagerClientV2 from '../plugin';

export type NotificationTypeOption = { label: string; value: string };

/**
 * Build the `[{ label, value }]` array of registered channel types.
 *
 * The shared collections declare `notificationType.uiSchema.enum =
 * '{{notificationTypeOptions}}'` — a v1 Formily template. v2's
 * `FilterValueInput` (Select branch) reads the field's `uiSchema.enum`
 * verbatim, so we must replace that template with the actual options
 * BEFORE the collection is registered via `ExtendCollectionsProvider`.
 *
 * Mirrors v1's `useNotificationTypes()` in
 * `src/client/manager/channel/hooks.tsx` minus the v1-only schema fields.
 */
export function getNotificationTypeOptions(
  plugin: PluginNotificationManagerClientV2 | undefined,
  compileT: (key: string) => string,
): NotificationTypeOption[] {
  if (!plugin) return [];
  return Array.from(plugin.channelTypes.getEntities()).map(([, val]) => ({
    label: compileT(val.title),
    value: val.type,
  }));
}

/**
 * Return a deep-enough copy of a collection definition with the
 * `notificationType` field's `uiSchema.enum` replaced by the live
 * options. No-op when the collection has no `notificationType` field.
 */
export function withResolvedNotificationTypeEnum<T extends { fields: any[] }>(
  collection: T,
  options: NotificationTypeOption[],
): T {
  return {
    ...collection,
    fields: collection.fields.map((field) =>
      field?.name === 'notificationType' && field.uiSchema
        ? { ...field, uiSchema: { ...field.uiSchema, enum: options } }
        : field,
    ),
  };
}
