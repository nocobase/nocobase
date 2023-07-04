import { ReturnTypeOfUseRequest, useRequest } from '@nocobase/client';
import { isString } from '@nocobase/utils';
import { error } from '@nocobase/utils/client';
import { theme } from 'antd';
import React, { createContext, useMemo } from 'react';
import { ThemeItem } from '../../types';

interface TData extends Pick<ReturnTypeOfUseRequest, 'data' | 'error' | 'run' | 'refresh' | 'loading'> {
  data?: ThemeItem[];
}

const ThemeListContext = createContext<TData>(null);

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
    return ((data as any)?.data as ThemeItem[])?.map((item) => paseThemeConfig(item));
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

/**
 * 把算法函数由字符串转换为函数
 * 注: 之所以要保存为字符串, 是因为 JSON 无法保存函数
 */
function paseThemeConfig(themeConfig: ThemeItem) {
  if (isString(themeConfig.config.algorithm)) {
    themeConfig.config.algorithm = theme[themeConfig.config.algorithm];
  }
  if (Array.isArray(themeConfig.config.algorithm)) {
    themeConfig.config.algorithm = themeConfig.config.algorithm.map((item) => {
      if (isString(item)) {
        return theme[item];
      }
      return item;
    });
  }
  return themeConfig;
}
