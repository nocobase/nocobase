/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRecord } from '@nocobase/client';
import { Table } from 'antd';
import React from 'react';

export const ConfigureFields = () => {
  const record = useRecord();
  return (
    <Table
      columns={[
        {
          title: '字段标识',
          dataIndex: 'name',
        },
      ]}
      dataSource={record.fields || []}
    />
  );
};
