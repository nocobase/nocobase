import { Popover } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { InternalNester } from './InternalNester';

function isEmptyObject(obj) {
  // 判断是否是对象
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // 如果是数组
  if (Array.isArray(obj)) {
    // 判断数组长度是否为1，并且第一个元素是否是空对象
    return obj.length === 1 && typeof obj[0] === 'object' && Object.keys(obj[0]).length === 0;
  }

  // 如果是普通对象
  return Object.keys(obj).length === 0;
}

export const InternaPopoverNester = (props) => {
  const field: any = useField();
  const content = (
    <div style={{ minWidth: '400px', maxHeight: '440px', overflow: 'auto' }}>
      <InternalNester {...props} />
    </div>
  );
  return (
    <Popover
      content={content}
      trigger="click"
      placement="topLeft"
      onOpenChange={(open) => {
        console.log(open);
        console.log(field.value);
      }}
    >
      <span style={{ cursor: 'pointer' }}>
        {!isEmptyObject(field.value) ? <ReadPrettyInternalViewer {...props} enableLink={true} /> : <EditOutlined />}
      </span>
    </Popover>
  );
};
