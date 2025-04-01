import { useFieldSchema } from '@formily/react';
import { useBlockResource } from '@nocobase/client';
import { useApplyFilter } from '@nocobase/plugin-event-filter-system/client';
import { Spin, Table } from 'antd';
import React, { useMemo } from 'react';

const DemoTable = (props) => {
  const settings = useFieldSchema();
  const resource = useBlockResource();

  // 使用 useMemo 记忆 resourceParams 对象，避免每次渲染时创建新引用
  const resourceParams = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
    }),
    [],
  );

  const { done, result } = useApplyFilter('core:block:table', {
    props: props,
    settings: settings['x-block-settings'],
    resource: resource,
    resourceParams, // 使用记忆的对象
  });

  if (!done) {
    return <Spin />;
  }

  const columns = result?.columns || [];
  const data = result?.data?.data?.data || [];

  return <Table columns={columns} dataSource={data} />;
};

export default DemoTable;
