/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
