import { observer } from '@formily/react';
import { Input } from 'antd';
import { debounce } from 'lodash';
import React, { useState, useMemo, useEffect } from 'react';
import { useRecord } from '@nocobase/client';

export const FieldTitleInput = observer(
  (props: any) => {
    const { value, handleFieldChange } = props;
    const record = useRecord();
    const [titleValue, setTitleValue] = useState(value);
    // 实时更新
    const handleRealTimeChange = (newValue: string) => {
      setTitleValue(newValue);
    };

    // 防抖操作
    const debouncedHandleFieldChange = useMemo(() => {
      return debounce((newTitle: string) => {
        handleFieldChange(
          {
            uiSchema: {
              ...record?.uiSchema,
              title: newTitle,
            },
          },
          record.name,
        );
      }, 1000);
    }, [handleFieldChange, record]);

    // 统一处理函数，实时更新+防抖
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      handleRealTimeChange(newValue);
      debouncedHandleFieldChange(newValue);
    };
    useEffect(() => {
      setTitleValue(value);
    }, [value]);
    return (
      <Input value={titleValue} onChange={handleChange} style={{ minWidth: '100px' }} aria-label="field-title-input" />
    );
  },
  { displayName: 'FieldTitleInput' },
);
