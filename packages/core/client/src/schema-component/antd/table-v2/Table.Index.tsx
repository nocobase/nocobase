import React from 'react';
import { useRecordIndex } from '../../../record-provider';

export const TableIndex = (props) => {
  const recordIndex = useRecordIndex();
  return <div>{recordIndex + 1}</div>;
};
