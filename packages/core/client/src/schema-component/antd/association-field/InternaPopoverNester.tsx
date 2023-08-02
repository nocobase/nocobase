import { Popover } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useField, observer } from '@formily/react';
import React, { useState } from 'react';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { InternalNester } from './InternalNester';

export const InternaPopoverNester = observer(
  (props) => {
    const field: any = useField();
    const content = (
      <div style={{ minWidth: '600px', maxHeight: '440px', overflow: 'auto' }}>
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
        overlayStyle={{ padding: '0px' }}
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
        <span style={{ cursor: 'pointer', display: 'inline-block', minWidth: '400px' }}>
          <div style={{ display: 'inline-flex' }}>
            <ReadPrettyInternalViewer {...titleProps} />
          </div>
          <EditOutlined style={{ display: 'inline-flex', marginLeft: '5px' }} />
        </span>
      </Popover>
    );
  },
  { displayName: 'InternaPopoverNester' },
);
