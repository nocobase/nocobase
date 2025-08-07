/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';

/**
 * 变量：`系统设置`
 * @param param0
 * @returns
 */
export const useSystemSettingsVariable = () => {
  const { t } = useTranslation();
  const systemSettings = {
    key: '$systemSettings',
    value: '$systemSettings',
    label: t('System settings'),
    isLeaf: false,
    children: [
      {
        key: 'title',
        value: 'title',
        label: t('System title'),
        isLeaf: true,
      },
    ],
  };

  return {
    /** 变量的配置项 */
    systemSettings,
  };
};
