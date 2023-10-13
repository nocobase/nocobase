import { css } from '@emotion/css';
import { Button, ButtonProps } from 'antd';
import { cx } from 'antd-style';
import React, { forwardRef, useMemo } from 'react';

export const XButton = forwardRef((props: ButtonProps, ref: any) => {
  const style = useMemo(() => {
    return {
      fontStyle: 'italic',
      fontFamily: 'New York, Times New Roman, Times, serif',
    };
  }, []);

  return (
    <Button ref={ref} style={style} {...props}>
      x{props.children}
    </Button>
  );
});
