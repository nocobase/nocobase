/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';

const style: React.CSSProperties = { overflowWrap: 'break-word', whiteSpace: 'normal' };

export const RenderTextInCell: FC<{ value: string; ellipsis: boolean }> = ({ value, ellipsis = false }) => {
  if (ellipsis) {
    return (
      <EllipsisWithTooltip role="button" ellipsis>
        {value}
      </EllipsisWithTooltip>
    );
  }
  return (
    <span role="button" style={style}>
      {value}
    </span>
  );
};
