import React from 'react';
import { css } from '@emotion/css';
import classNames from 'classnames';
export const MobileCenter = () => {
  return (
    <div
      className={classNames(
        'nb-mobile-client-center',
        css`
          &.nb-mobile-client-center {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        `,
      )}
    >
      <div
        className={css(`
          display: flex;
          background-color: #fff;
          width: 375px;
          height: 667px;
      `)}
      ></div>
    </div>
  );
};
