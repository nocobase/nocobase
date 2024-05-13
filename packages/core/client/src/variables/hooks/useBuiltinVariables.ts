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
import { useCurrentRoleVariable } from '../../schema-settings/VariableInput/hooks/useRoleVariable';
import { VariableOption } from '../types';

const useBuiltInVariables = () => {
  const { currentUserCtx } = useCurrentUserVariable();
  const { currentRoleCtx } = useCurrentRoleVariable();
  const { datetimeCtx } = useDatetimeVariable();
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
    ];
  }, [currentRoleCtx, currentUserCtx, datetimeCtx]);

  return { builtinVariables };
};

export default useBuiltInVariables;
