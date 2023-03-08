import React from 'react';
import { useField } from '@formily/react';
import { CopyOutlined } from '@ant-design/icons';
import { clone } from 'lodash';
import { ArrayBase } from '@formily/antd';

export const LinkageCopy = React.forwardRef((props: any, ref) => {
  const self = useField();
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex(props.index);
  if (!array) return null;
  if (array.field?.pattern !== 'editable') return null;
  return (
    <CopyOutlined
      {...props}
      style={{
        transition: 'all 0.25s ease-in-out',
        color: 'rgba(0, 0, 0, 0.8)',
        fontSize: '16px',
        marginLeft: 6,
      }}
      ref={ref}
      onClick={(e) => {
        if (self?.disabled) return;
        e.stopPropagation();
        if (array.props?.disabled) return;
        const value = clone(array?.field?.value[index]);
        const distIndex = index + 1;
        array.field?.insert?.(distIndex, value);
        //@ts-ignore
        array.props?.onCopy?.(distIndex);
        if (props.onClick) {
          props.onClick(e);
        }
      }}
    />
  );
});
