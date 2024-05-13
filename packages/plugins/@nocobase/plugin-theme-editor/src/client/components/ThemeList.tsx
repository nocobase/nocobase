/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
    <Space size={token.marginLG} wrap>
      {data?.map((item) => {
        return <ThemeCard item={item} key={item.id} onChange={handleChange} />;
      })}
      <ToEditTheme />
    </Space>
  );
};

ThemeList.displayName = 'ThemeList';

export default ThemeList;
