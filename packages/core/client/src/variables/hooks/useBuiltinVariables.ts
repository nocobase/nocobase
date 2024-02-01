import { dayjs } from '@nocobase/utils/client';
import { useMemo } from 'react';
import { useAPIClient } from '../../api-client';
import { getDateRanges } from '../../schema-component/antd/date-picker/util';
import { useCurrentUserVariable } from '../../schema-settings';
import { VariableOption } from '../types';

const useBuiltInVariables = () => {
  const { currentUserCtx } = useCurrentUserVariable();
  const apiClient = useAPIClient();

  const dateVars = getDateRanges();
  const builtinVariables: VariableOption[] = useMemo(() => {
    return [
      {
        name: '$user',
        ctx: currentUserCtx,
        collectionName: 'users',
      },
      {
        name: '$nRole',
        ctx: apiClient.auth?.role,
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
      },
      {
        name: '$nDate',
        ctx: dateVars,
      },
      /**
       * @deprecated
       * 兼容旧版本的 `$date` 变量，新版本已弃用
       */
      {
        name: '$date',
        ctx: dateVars,
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
  }, [currentUserCtx]);

  return { builtinVariables };
};

export default useBuiltInVariables;
