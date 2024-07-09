/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs } from '@nocobase/utils/client';
import { useMemo } from 'react';
import { DEFAULT_DATA_SOURCE_KEY } from '../../data-source/data-source/DataSourceManager';
import { useCurrentUserVariable, useDatetimeVariable } from '../../schema-settings';
import { useAPITokenVariable } from '../../schema-settings/VariableInput/hooks/useAPITokenVariable';
import { useCurrentRoleVariable } from '../../schema-settings/VariableInput/hooks/useRoleVariable';
import { useURLSearchParamsVariable } from '../../schema-settings/VariableInput/hooks/useURLSearchParamsVariable';
import { VariableOption } from '../types';

/**
 * 相当于全局的变量
 * @returns
 */
const useBuiltInVariables = () => {
  const { currentUserCtx } = useCurrentUserVariable();
  const { currentRoleCtx } = useCurrentRoleVariable();
  const { apiTokenCtx } = useAPITokenVariable();
  const { datetimeCtx } = useDatetimeVariable();
  const { urlSearchParamsCtx, name: urlSearchParamsName, defaultValue } = useURLSearchParamsVariable();
  const builtinVariables: VariableOption[] = useMemo(() => {
    return [
      {
        name: '$user',
        ctx: currentUserCtx as any,
        collectionName: 'users',
        dataSource: DEFAULT_DATA_SOURCE_KEY as string,
      },
      {
        name: '$nRole',
        ctx: currentRoleCtx as any,
        collectionName: 'roles',
      },
      {
        name: '$nToken',
        ctx: apiTokenCtx as any,
      },
      /**
       * @deprecated
       * 兼容老版本
       */
      {
        name: 'currentUser',
        ctx: currentUserCtx,
        collectionName: 'users',
        dataSource: DEFAULT_DATA_SOURCE_KEY as string,
      },
      {
        name: '$nDate',
        ctx: datetimeCtx,
      },
      /**
       * @deprecated
       * 兼容旧版本的 `$date` 变量，新版本已弃用
       */
      {
        name: '$date',
        ctx: datetimeCtx,
      },
      /**
       * @deprecated
       * 兼容旧版本的 `$system` 变量，新版本已弃用
       */
      {
        name: '$system',
        ctx: {
          now: () => dayjs().toISOString(),
        },
      },
      /**
       * @deprecated
       * 旧版本的一个变量，新版用 `$nDate` 代替
       */
      {
        name: 'currentTime',
        ctx: () => dayjs().toISOString(),
      },
      {
        name: urlSearchParamsName,
        ctx: urlSearchParamsCtx,
        defaultValue,
      },
    ];
  }, [currentRoleCtx, currentUserCtx, datetimeCtx, defaultValue, urlSearchParamsCtx, urlSearchParamsName]);

  return { builtinVariables };
};

export default useBuiltInVariables;
