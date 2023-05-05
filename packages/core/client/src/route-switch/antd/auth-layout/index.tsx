import { css } from '@emotion/css';
import React from 'react';
import { PoweredBy } from '../../../powered-by';
import { useSystemSettings } from '../../../system-settings';

export function AuthLayout(props: any) {
  const { data } = useSystemSettings();
  return (
    <div
      style={{
        background: `url(${data?.data?.loginBgImg?.url}) no-repeat`,
        width: '100vw',
        height: '100vh',
        paddingTop: '20vh',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 460,
          margin: '0 auto',
          background: '#fff',
          padding: '30px 60px',
          borderRadius: '20px',
        }}
      >
        <h1>{data?.data?.title}</h1>
        {props.children}
        <div
          className={css`
            position: absolute;
            bottom: 24px;
            width: 100%;
            left: 0;
            display: flex;
            justify-content: center;
          `}
        >
          <PoweredBy />
        </div>
      </div>
    </div>
  );
}
