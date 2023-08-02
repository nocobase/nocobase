import { dayjs } from '@nocobase/utils/client';
import { useMemo } from 'react';
import { useCurrentUserContext } from '../../user';
import { VariableOption } from '../types';

const useBuildInVariables = () => {
  const currentUser = useCurrentUserContext();
  const builtinVariables: VariableOption[] = useMemo(() => {
    return [
      {
        name: '$date',
        ctx: {
          now: () => dayjs().toISOString(),
        },
      },
      {
        name: '$user',
        ctx: currentUser?.data?.data,
        collectionName: 'users',
      },
    ];
  }, [currentUser?.data?.data]);

  return { builtinVariables };
};

export default useBuildInVariables;
