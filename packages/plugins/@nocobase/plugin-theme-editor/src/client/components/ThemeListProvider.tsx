import { ReturnTypeOfUseRequest, useRequest } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import React, { createContext, useMemo } from 'react';
import { ThemeItem } from '../../types';
import { changeAlgorithmFromStringToFunction } from '../utils/changeAlgorithmFromStringToFunction';

interface TData extends Pick<ReturnTypeOfUseRequest, 'data' | 'error' | 'run' | 'refresh' | 'loading'> {
  data?: ThemeItem[];
}

const ThemeListContext = createContext<TData>(null);
ThemeListContext.displayName = 'ThemeListContext';

export const useThemeListContext = () => {
  return React.useContext(ThemeListContext);
};

export const ThemeListProvider = ({ children }) => {
  const {
    data,
    error: err,
    run,
    refresh,
    loading,
  } = useRequest(
    {
      url: 'themeConfig:list',
      params: {
        sort: 'id',
        paginate: false,
      },
    },
    {
      manual: true,
    },
  );

  const items = useMemo(() => {
    return ((data as any)?.data as ThemeItem[])?.map((item) => changeAlgorithmFromStringToFunction(item));
  }, [data]);

  if (err) {
    error(err);
  }

  return (
    <ThemeListContext.Provider
      value={{
        data: items,
        error: err,
        run,
        refresh,
        loading,
      }}
    >
      {children}
    </ThemeListContext.Provider>
  );
};

ThemeListProvider.displayName = 'ThemeListProvider';
