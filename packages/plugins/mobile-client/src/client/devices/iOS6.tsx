import { css, cx } from '@nocobase/client';
import React from 'react';

const iOS6: React.FC<{
  className: string;
}> = (props) => {
  return (
    <div
      className={cx(
        'nb-mobile-device-ios6',
        css(`
          display: flex;
          width: 375px;
          height: 667px;
      `),
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};

export default iOS6;
