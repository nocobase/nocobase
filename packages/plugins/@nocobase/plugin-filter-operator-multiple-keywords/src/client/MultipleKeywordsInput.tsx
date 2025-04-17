/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect, useCollection } from '@nocobase/client';
import React, { FC } from 'react';
import { Button, Space } from 'antd';
import { useFieldSchema } from '@formily/react';

export const MultipleKeywordsInput: FC<any> = (props) => {
  const collection = useCollection();
  const fieldSchema = useFieldSchema();

  return (
    <Space.Compact block>
      <RemoteSelect
        mode="tags"
        placeholder="支持输入多个关键词，通过逗号或者换行符分割"
        tokenSeparators={[',', '\n', '，']}
        fieldNames={{
          label: fieldSchema.name as string,
          value: fieldSchema.name as string,
        }}
        service={{
          resource: collection.name,
          action: 'list',
        }}
        {...props}
      />
      <Button>导入 Excel</Button>
    </Space.Compact>
  );
};
