/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// AntdInputEditor.tsx
import { Input, Select } from 'antd';
import React, { useEffect, useRef } from 'react';

interface Props {
  value: any;
  onSuccess: (value: any) => void;
  onCancel: (value?: any) => void;
}

export const AntdInputEditor: React.FC<Props> = (props) => {
  const { value, onSuccess, onCancel } = props;
  const inputRef = useRef<any>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', inputRef.current);
    // if (e.key === 'Enter') onSuccess(inputRef.current?.input?.value);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <Input
      ref={inputRef}
      onKeyDown={handleKeyDown}
      defaultValue={value}
      // autoSize={{ minRows: 3 }}
      onBlur={(e) => onSuccess(e.target.value)}
    />
    // <Select
    //   options={[
    //     { label: 'Option 1', value: 'option1' },
    //     { label: 'Option 2', value: 'option2' },
    //     { label: 'Option 3', value: 'option3' },
    //   ]}
    // />
    // <Input
    //   ref={inputRef}
    //   defaultValue={value}
    //   onBlur={() => onSuccess(inputRef.current?.input?.value)}
    //   onKeyDown={handleKeyDown}
    // />
  );
};
