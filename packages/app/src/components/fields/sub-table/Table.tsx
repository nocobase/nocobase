import React, { useEffect, useRef, useState } from 'react';
import View from '@/components/views';

export interface SimpleTableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

export function generateIndex(): string {
  return `${Math.random()
    .toString(36)
    .replace('0.', '')
    .slice(-4)
    .padStart(4, '0')}`;
}

export default function Table(props: SimpleTableProps) {
  const { schema = {}, associatedKey, value, onChange, __index } = props;
  const { collection_name, name } = schema;
  const viewName = `${collection_name}.${name}.${schema.viewName || 'table'}`;
  console.log({ props, associatedKey, schema, __index, viewName });
  return (
    <>
      <View
        // __parent={__parent}
        data={value}
        onChange={onChange}
        __index={__index}
        associatedKey={associatedKey}
        viewName={viewName}
        type={'subTable'}
      />
    </>
  );
}
