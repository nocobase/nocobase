/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient } from '../../../api-client/hooks/useAPIClient';
import { useBaseVariable } from './useBaseVariable';
import { string } from '../../../collection-manager/interfaces/properties/operators';

/**
 * 变量：`当前 Token`
 * @param param0
 * @returns
 */
export const useAPITokenVariable = ({
  noDisabled,
}: {
  noDisabled?: boolean;
} = {}) => {
  const apiClient = useAPIClient();
  const apiTokenSettings = useBaseVariable({
    name: '$nToken',
    title: 'API token',
    noDisabled,
    noChildren: true,
    operators: string,
  });

  return {
    /** 变量配置项 */
    apiTokenSettings,
    /** 变量的值 */
    apiTokenCtx: apiClient.auth?.token,
  };
};
