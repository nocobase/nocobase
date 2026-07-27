/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { translateCli } from './cli-locale.js';
import { toPortalOutputItem, type PortalListItem } from './portal-list.js';

const portalInfoText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalInfo.${key}`, values, { fallback });

function formatBoolean(value: boolean | null): string {
  if (value === null) {
    return '';
  }
  return value ? 'yes' : 'no';
}

export function findPortalListItem(items: PortalListItem[], portal: string): PortalListItem | undefined {
  return items.find((item) => item.routeName === portal || item.uid === portal);
}

export function formatPortalInfo(item: PortalListItem): string {
  const outputItem = toPortalOutputItem(item);

  return [
    `${portalInfoText('fields.name', undefined, 'Name')}: ${outputItem.name}`,
    `${portalInfoText('fields.url', undefined, 'URL')}: ${outputItem.url}`,
    `${portalInfoText('fields.portalType', undefined, 'Portal type')}: ${outputItem.portalType}`,
    `${portalInfoText('fields.path', undefined, 'Local path')}: ${outputItem.localPath}`,
    `${portalInfoText('fields.enabled', undefined, 'Enabled')}: ${formatBoolean(outputItem.enabled)}`,
    `${portalInfoText('fields.localSynced', undefined, 'Local synced')}: ${formatBoolean(outputItem.localSynced)}`,
  ].join('\n');
}
