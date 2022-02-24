import React from 'react';

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
    </div>
  );
}
