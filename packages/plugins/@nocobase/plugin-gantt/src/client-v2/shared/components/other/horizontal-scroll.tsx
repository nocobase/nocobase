/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { SyntheticEvent, forwardRef } from 'react';
import { cx } from '@emotion/css';
import useStyles from './style';

type HorizontalScrollProps = {
  scrollWidth: number;
  rtl: boolean;
  onScroll: (event: SyntheticEvent<HTMLDivElement>) => void;
};

export const HorizontalScroll = forwardRef<HTMLDivElement, HorizontalScrollProps>(
  ({ scrollWidth, rtl, onScroll }, ref) => {
    const { styles } = useStyles();

    return (
      <div
        dir="ltr"
        className={cx(styles.nbGridOther, styles.scrollWrapper, 'gantt-horizontal-scoll')}
        onScroll={onScroll}
        ref={ref}
      >
        <div style={{ width: scrollWidth, height: 1 }} className="horizontalScroll" />
      </div>
    );
  },
);

HorizontalScroll.displayName = 'HorizontalScroll';
