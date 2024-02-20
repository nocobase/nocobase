import React from 'react';
import { observer } from '@formily/react';
import { useRecord_deprecated } from '@nocobase/client';
import { Tag, Select } from 'antd';

export const FieldType = observer(
  (props: any) => {
    const { value, handleFieldChange, onChange } = props;
    const record = useRecord_deprecated();
    const item = record;
    return !item?.possibleTypes ? (
      <Tag>{value}</Tag>
    ) : (
      <Select
        defaultValue={value}
        popupMatchSelectWidth={false}
        style={{ width: '100%' }}
        options={
          item?.possibleTypes.map((v) => {
            return { label: v, value: v };
          }) || []
        }
        onChange={(value) => {
          onChange?.(value);
          handleFieldChange({ ...item, type: value }, record.name);
        }}
      />
    );
  },
  { displayName: 'FieldType' },
);
