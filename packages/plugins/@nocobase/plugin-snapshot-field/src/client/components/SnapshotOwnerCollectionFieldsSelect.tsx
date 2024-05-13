/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionManager_deprecated, useCompile } from '@nocobase/client';
import { Select, SelectProps } from 'antd';
import React from 'react';
import { useTopRecord } from '../interface';

export type SnapshotOwnerCollectionFieldsSelectProps = Omit<SelectProps, 'options'>;

export const useSnapshotOwnerCollectionFields = () => {
  const record = useTopRecord();
  const { getCollection } = useCollectionManager_deprecated();
  const collection = getCollection(record.name);
  const compile = useCompile();

  return collection.fields
    .filter((i) => !!i.target && !!i.interface)
    .map((i) => ({ ...i, label: compile(i.uiSchema?.title), value: i.name }));
};

export const SnapshotOwnerCollectionFieldsSelect: React.FC<SnapshotOwnerCollectionFieldsSelectProps> = (props) => {
  const options = useSnapshotOwnerCollectionFields();
  return <Select popupMatchSelectWidth={false} options={options} {...props} />;
};
