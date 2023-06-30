import { useRequest } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { Space } from 'antd';
import React, { useCallback, useEffect } from 'react';
import { ThemeItem } from '../../types';
import ThemeCard from './ThemeCard';
import { useThemeEditorContext } from './ThemeEditorProvider';
import ToEditTheme from './ToEditTheme';

interface TData {
  data: ThemeItem[];
}

const ThemeList = () => {
  const { refreshRef } = useThemeEditorContext();
  const {
    data,
    error: err,
    refresh,
  }: { data: TData; loading: boolean; error: any; refresh: () => any } = useRequest<TData>({
    url: 'themeConfig:list',
    params: {
      sort: 'id',
      paginate: false,
    },
  });

  useEffect(() => {
    refreshRef.current = refresh;
    return () => {
      refreshRef.current = null;
    };
  }, [refresh]);

  const handleChange = useCallback(() => {
    refresh();
  }, [refresh]);

  if (err) {
    error(err);
    throw `ThemeList: ${err}`;
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
