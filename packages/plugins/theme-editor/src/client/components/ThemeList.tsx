import { useToken } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { Space } from 'antd';
import React, { useCallback, useEffect } from 'react';
import ThemeCard from './ThemeCard';
import { useThemeListContext } from './ThemeListProvider';
import ToEditTheme from './ToEditTheme';

const ThemeList = () => {
  const { run, error: err, refresh, data } = useThemeListContext();
  const { token } = useToken();

  useEffect(() => {
    if (!data) {
      run();
    }
  }, []);

  const handleChange = useCallback(() => {
    refresh();
  }, [refresh]);

  if (err) {
    error(err);
    return null;
  }

  return (
    <Space size={token.sizeLG} wrap>
      {data?.map((item) => {
        return <ThemeCard item={item} key={item.id} onChange={handleChange} />;
      })}
      <ToEditTheme />
    </Space>
  );
};

ThemeList.displayName = 'ThemeList';

export default ThemeList;
