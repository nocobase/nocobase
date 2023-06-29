import { useRequest } from '@nocobase/client';
import { Space } from 'antd';
import React, { useCallback } from 'react';
import { ThemeItem } from '../../types';
import ThemeCard from './ThemeCard';
import ToEditTheme from './ToEditTheme';

interface TData {
  data: ThemeItem[];
}

const ThemeList = () => {
  const { data, error, refresh }: { data: TData; loading: boolean; error: any; refresh: () => any } = useRequest<TData>(
    {
      url: 'themeConfig:list',
      params: {
        sort: 'id',
        paginate: false,
      },
    },
  );

  const handleChange = useCallback(() => {
    refresh();
  }, [refresh]);

  if (error) {
    throw error;
  }

  return (
    <Space size="large" wrap>
      {data?.data.map((item) => {
        return <ThemeCard item={item} key={item.id} onChange={handleChange} />;
      })}
      <ToEditTheme />
    </Space>
  );
};

ThemeList.displayName = 'ThemeList';

export default ThemeList;
