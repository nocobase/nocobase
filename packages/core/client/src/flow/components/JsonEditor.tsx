/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps } from '@formily/react';
import { Alert, Input } from 'antd';
import React, { useEffect, useState } from 'react';

interface JsonEditorProps {
  value?: any;
  onChange?: (value: any) => void;
  rows?: number;
  [key: string]: any;
}

const InnerJsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, rows = 10, ...rest }) => {
  const [text, setText] = useState(() => (value ? JSON.stringify(value, null, 2) : ''));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 外部 value 变化时同步
    setText(value ? JSON.stringify(value, null, 2) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    try {
      const json = val.trim() ? JSON.parse(val) : undefined;
      setError(null);
      onChange?.(json);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Input.TextArea value={text} autoSize={{ minRows: rows, maxRows: rows + 10 }} onChange={handleChange} {...rest} />
      {error && <Alert type="error" message={error} showIcon style={{ marginTop: 8 }} />}
    </div>
  );
};

// 让 Formily 支持 value/onChange 透传
export const JsonEditor = connect(InnerJsonEditor);

export default JsonEditor;
