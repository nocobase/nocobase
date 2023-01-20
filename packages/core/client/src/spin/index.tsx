import React from 'react';
import { Spin as SpinComponent } from 'antd';
import { css } from '@emotion/css';

interface IProps {
  spinning?: boolean;
  children?: React.ReactNode;
}

export function Spin({ spinning, children }: IProps) {
  return <SpinComponent 
    className={css`
      height: 100%;
      width: 100%;
      justify-content: center;
      display: flex;
      align-items: center;
    `}
    spinning={spinning}
  >{children}</SpinComponent>;
};
