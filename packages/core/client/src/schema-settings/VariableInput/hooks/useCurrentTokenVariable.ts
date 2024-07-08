/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client/hooks/useAPIClient';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前 Token`
 * @param param0
 * @returns
 */
export const useCurrentTokenVariable = ({
  noDisabled,
}: {
  noDisabled?: boolean;
} = {}) => {
  const { t } = useTranslation();
  const apiClient = useAPIClient();
  const currentTokenSettings = useBaseVariable({
    name: '$nToken',
    title: t('Current token'),
    noDisabled,
    noChildren: true,
  });

  return {
    /** 变量配置项 */
    currentTokenSettings,
    /** 变量的值 */
    currentTokenCtx: apiClient.auth?.token,
  };
};
