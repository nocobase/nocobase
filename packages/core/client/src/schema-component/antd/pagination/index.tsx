import { observer } from '@formily/react';
import { Pagination as AntdPagination } from 'antd';
import React, { KeyboardEventHandler } from 'react';
import { useProps } from '../../hooks/useProps';

export const Pagination = observer(
  (props: any) => {
    const { hidden, ...others } = useProps(props);
    if (hidden) {
      return null;
    }
    const onKeypress: KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    };

    return (
      <div onKeyPress={onKeypress}>
        <AntdPagination {...others} />
      </div>
    );
  },
  { displayName: 'Pagination' },
);
