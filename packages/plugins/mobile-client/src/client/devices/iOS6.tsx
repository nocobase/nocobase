import { css, cx } from '@emotion/css';
import React from 'react';

const iOS6: React.FC = (props) => {
  return (
    <div
      className={cx(
        'nb-mobile-device-ios6',
        css(`
          display: flex;
          background-color: #fff;
          width: 375px;
          height: 667px;
      `),
      )}
    >
      {props.children}
    </div>
  );
};

export default iOS6;
