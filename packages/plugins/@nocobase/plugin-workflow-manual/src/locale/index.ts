/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';
import { NAMESPACE } from '../common/constants';

export { NAMESPACE };

export function useLang(key: string, options = {}) {
  const { t } = usePluginTranslation(options);
  return t(key);
}

export const lang = useLang;

export function usePluginTranslation(options?) {
  return useTranslation(NAMESPACE, options);
}
