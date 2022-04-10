import { css } from '@emotion/css';
import React from 'react';
import { PoweredBy } from '../../../powered-by';

export function AuthLayout(props: any) {
  return (
    <div
      style={{
        maxWidth: 320,
        margin: '0 auto',
        paddingTop: '20vh',
      }}
    >
      <h1>NocoBase</h1>
      {props.children}
      <div
        className={css`
          position: absolute;
          bottom: 24px;
          width: 100%;
          left: 0;
          text-align: center;
        `}
      >
        <PoweredBy />
      </div>
    </div>
  );
}
