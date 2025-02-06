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
import Device from './iOS6';

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
          margin-top: 50px;
        `,
      )}
    >
      <Device
        className={css`
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
        `}
        {...props}
      ></Device>
    </div>
  );
};
