import { observer } from '@formily/react';
import { Pagination as AntdPagination } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useProps } from '../../hooks/useProps';

export const Pagination = observer((props: any) => {
  const { hidden, ...others } = useProps(props);
  if (hidden) {
    return null;
  }
  const wrapper = useRef<HTMLDivElement>(null);
  const onKeypress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (wrapper.current) {
      wrapper.current.addEventListener('keypress', onKeypress);
      return () => {
        wrapper.current.removeEventListener('keypress', onKeypress);
      };
    }
  }, [wrapper.current]);

  return (
    <div ref={wrapper}>
      <AntdPagination {...others} />;
    </div>
  );
});
