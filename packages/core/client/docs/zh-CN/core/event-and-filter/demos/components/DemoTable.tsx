import { useFieldSchema } from '@formily/react';
import { useBlockResource } from '@nocobase/client';
import { useApplyFilter } from '@nocobase/plugin-event-filter-system/client';
import { Spin, Table } from 'antd';
import React, { useMemo } from 'react';

const DemoTable = (props) => {
  const { done, result } = useApplyFilter('core:block:table', {
    props: props,
  });

  if (!done) {
    return <Spin />;
  }

  const columns = result?.columns || [];
  const data = result?.data?.data || [];

  return <Table style={{ height: result?.height, width: result?.width }} columns={columns} dataSource={data} />;
};

export default DemoTable;
