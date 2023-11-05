import { dayjs } from '@nocobase/utils/client';
import { useMemo } from 'react';
import { getDateRanges } from '../../schema-component/antd/date-picker/util';
import { useCurrentUserContext } from '../../user';
import { VariableOption } from '../types';

const useBuiltInVariables = () => {
  const data = useCurrentUserContext();

  const currentUser = data?.data?.data;
  const dateVars = getDateRanges();
  // 使用函数方便测试断言
  dateVars.now = (() => dayjs().toISOString()) as any;
  const builtinVariables: VariableOption[] = useMemo(() => {
    return [
      {
        name: '$user',
        ctx: currentUser,
        collectionName: 'users',
      },
      /**
       * @deprecated
       * 兼容老版本
       */
      {
        name: 'currentUser',
        ctx: currentUser,
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
  }, [currentUser]);

  return { builtinVariables };
};

export default useBuiltInVariables;
