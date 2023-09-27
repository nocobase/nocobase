import React, { FC, useMemo } from 'react';
import { useApp } from '../application';
import { Outlet, useNavigate } from 'react-router-dom';
import { Card, Tabs } from 'antd';
import { useCompile } from '../schema-component';

export const SettingMultiPageLayout: FC<{ name: string }> = ({ name }) => {
  const app = useApp();
  const compile = useCompile();
  const navigate = useNavigate();
  const setting = useMemo(() => app.settingsCenter.get(name), [name, app]);
  const tabItems = useMemo(() => {
    return setting.children.map((item) => ({
      label: compile(item.label),
      key: item.path,
    }));
  }, [compile, setting.children]);
  return (
    <Card bordered={false}>
      <Tabs onChange={(path) => navigate(path)} items={tabItems}></Tabs>
      <Outlet />
    </Card>
  );
};
