import { useRequest } from '@nocobase/client';
import { Spin } from 'antd';
import React from 'react';
import { useBuiltInThemes } from '../builtInThemes';
import { ThemeConfig } from '../types';
import ThemeCard from './ThemeCard';

interface TData {
  data: ThemeConfig[];
}

const ThemeList = () => {
  const { data, loading }: { data: TData; loading: boolean } = useRequest<TData>({
    url: 'theme:list',
    params: {
      sort: 'name',
      paginate: false,
    },
  });
  const builtInThemes = useBuiltInThemes();

  if (loading) {
    return <Spin />;
  }

  if (!data?.data) {
    throw new Error('ThemeList: data is empty');
  }

  const list = [...builtInThemes, ...data.data];

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
