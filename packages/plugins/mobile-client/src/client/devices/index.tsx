import React from 'react';
import Device from './iOS6';
import { css, cx } from '@emotion/css';

export const MobileDevice: React.FC = (props) => {
  return (
    <div
      className={cx(
        'nb-mobile-device-wrapper',
        css`
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        `,
      )}
    >
      <Device
        className={css`
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
          overflow-x: auto;
          overflow-y: scroll;
        `}
        {...props}
      ></Device>
    </div>
  );
};
