import { useRequest } from '@nocobase/client';
import type { ThemeConfig } from 'antd';
import { Spin } from 'antd';
import React from 'react';
import { compactTheme, darkTheme, defaultTheme } from '../builtInThemes';
import ThemeCard from './ThemeCard';

interface TData {
  data: (ThemeConfig & { id: number })[];
}

const ThemeList = () => {
  const { data, loading }: { data: TData; loading: boolean } = useRequest<TData>({
    url: 'theme:list',
    params: {
      sort: 'name',
      paginate: false,
    },
  });
  if (loading) {
    return <Spin />;
  }

  if (!data?.data) {
    throw new Error('ThemeList: data is empty');
  }

  const list = [defaultTheme, compactTheme, darkTheme, ...data.data];

  return (
    <>
      {list.map((item) => {
        return <ThemeCard data={item} key={item.id} />;
      })}
    </>
  );
};

ThemeList.displayName = 'ThemeList';

export default ThemeList;
