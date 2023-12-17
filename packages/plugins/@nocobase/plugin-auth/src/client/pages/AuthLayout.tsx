import { css } from '@emotion/css';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSystemSettings, PoweredBy } from '@nocobase/client';

export function AuthLayout(props: any) {
  const { data } = useSystemSettings();
  return (
    <div
      style={{
        maxWidth: 320,
        margin: '0 auto',
        paddingTop: '20vh',
      }}
    >
      <h1>{data?.data?.title}</h1>
      <Outlet />
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
