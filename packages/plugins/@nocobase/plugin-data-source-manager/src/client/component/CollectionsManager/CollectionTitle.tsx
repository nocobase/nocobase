/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleTwoTone } from '@ant-design/icons';
import { useCollectionRecordData, useCompile, Input } from '@nocobase/client';
import { useField } from '@formily/react';
import { Popover } from 'antd';
import React from 'react';
import { SetFilterTargetKey } from './SetFilterTargetKey';

export const CollectionTitle = (props) => {
  const record = useCollectionRecordData() || {};
  const compile = useCompile();
  const field = useField();
  if (field.editable) {
    return <Input {...props} />;
  }
  if (record?.filterTargetKey) {
    return compile(record.title);
  }
  return (
    <div style={{ display: 'inline' }}>
      <Popover trigger={['click']} content={<SetFilterTargetKey size={'small'} style={{ width: '20em' }} />}>
        <ExclamationCircleTwoTone style={{ marginRight: '0.3em' }} twoToneColor="#faad14" />
      </Popover>
      {compile(record.title)}
    </div>
  );
};
