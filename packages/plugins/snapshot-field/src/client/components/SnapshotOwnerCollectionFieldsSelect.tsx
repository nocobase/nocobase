import React from 'react';
import { Select, SelectProps } from 'antd';
import { useTopRecord } from '../interface';
import { useCollectionManager, useCompile } from '@nocobase/client';

export type SnapshotOwnerCollectionFieldsSelectProps = Omit<SelectProps, 'options'>;

export const useSnapshotOwnerCollectionFields = () => {
  const record = useTopRecord();
  const { getCollection } = useCollectionManager();
  const collection = getCollection(record.name);
  const compile = useCompile();

  return collection.fields
    .filter((i) => !!i.target && !!i.interface)
    .map((i) => ({ ...i, label: compile(i.uiSchema?.title), value: i.name }));
};

export const SnapshotOwnerCollectionFieldsSelect: React.FC<SnapshotOwnerCollectionFieldsSelectProps> = (props) => {
  const options = useSnapshotOwnerCollectionFields();
  return <Select options={options} {...props} />;
};
