/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, ButtonProps } from 'antd';
import React, { forwardRef, useMemo } from 'react';
import { FlagProvider } from '../../../flag-provider/FlagProvider';

export const XButton = forwardRef((props: ButtonProps, ref: any) => {
  const style = useMemo(() => {
    return {
      fontStyle: 'italic',
      fontFamily: 'New York, Times New Roman, Times, serif',
    };
  }, []);

  return (
    <FlagProvider isInXButton>
      <Button aria-label="variable-button" ref={ref} style={style} {...props}>
        x{props.children}
      </Button>
    </FlagProvider>
  );
});
XButton.displayName = 'XButton';
