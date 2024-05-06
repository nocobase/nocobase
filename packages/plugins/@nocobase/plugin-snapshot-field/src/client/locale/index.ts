/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'snapshot-field';

// i18n.addResources('zh-CN', NAMESPACE, zhCN);
// i18n.addResources('en-US', NAMESPACE, enUS);
// i18n.addResources('ja-JP', NAMESPACE, jaJP);
// i18n.addResources('ru-RU', NAMESPACE, ruRU);
// i18n.addResources('tr-TR', NAMESPACE, trTR);

export function lang(key: string) {
  return i18n.t(key, { ns: NAMESPACE });
}

export function useSnapshotTranslation() {
  return useTranslation(NAMESPACE);
}
