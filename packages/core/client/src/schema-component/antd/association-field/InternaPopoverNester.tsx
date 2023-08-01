import { Popover } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useField, observer } from '@formily/react';
import React, { useMemo, useState } from 'react';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { InternalNester } from './InternalNester';

function isEmptyObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  if (Array.isArray(obj)) {
    return obj.length === 1 && typeof obj[0] === 'object' && Object.keys(obj[0]).length === 0;
  }
  return Object.keys(obj).length === 0;
}

export const InternaPopoverNester = observer(
  (props) => {
    const field: any = useField();
    const content = (
      <div style={{ minWidth: '400px', maxHeight: '440px', overflow: 'auto' }}>
        <InternalNester {...props} />
      </div>
    );
    const [value, setValue] = useState(field.value);
    const titleProps = {
      ...props,
      enableLink: true,
    };
    return (
      <Popover
        content={content}
        trigger="click"
        placement="topLeft"
        onOpenChange={(open) => {
          if (!open) {
            const data = Array.isArray(field.value) ? [...field.value] : { ...field.value };
            setValue(data);
          }
        }}
      >
        <span style={{ cursor: 'pointer', display: 'inline-block', width: '100%' }}>
          {!isEmptyObject(value) ? <ReadPrettyInternalViewer {...titleProps} /> : <EditOutlined />}
        </span>
      </Popover>
    );
  },
  { displayName: 'InternaPopoverNester' },
);
