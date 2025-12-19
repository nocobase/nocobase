/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tooltip, Typography } from 'antd';

const NAME_MAX_WIDTH = 480;
const OPTION_MAX_WIDTH = 520;
const TOOLTIP_MAX_WIDTH = 400;

export function renderTemplateSelectLabel(name: React.ReactNode, maxWidth = NAME_MAX_WIDTH) {
  return (
    <span
      style={{
        display: 'inline-block',
        maxWidth,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      {name}
    </span>
  );
}

export type TemplateSelectOptionData = {
  rawName?: React.ReactNode;
  description?: React.ReactNode;
  disabledReason?: React.ReactNode;
};

export type TemplateSelectOptionRenderArg = {
  label?: React.ReactNode;
  data?: TemplateSelectOptionData;
};

export function renderTemplateSelectOption(option: TemplateSelectOptionRenderArg) {
  const desc = option?.data?.description;
  const disabledReason = option?.data?.disabledReason;
  const isDisabled = !!disabledReason;
  const name = option?.data?.rawName || option?.label;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '4px 0',
        maxWidth: OPTION_MAX_WIDTH,
        opacity: isDisabled ? 0.5 : 1,
        width: '100%',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Typography.Text
        strong
        style={{
          maxWidth: NAME_MAX_WIDTH,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </Typography.Text>
      {desc && (
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {desc}
        </Typography.Text>
      )}
    </div>
  );

  if (isDisabled && disabledReason) {
    return (
      <Tooltip
        title={disabledReason}
        placement="right"
        zIndex={9999}
        overlayStyle={{ maxWidth: TOOLTIP_MAX_WIDTH }}
        mouseEnterDelay={0.1}
      >
        <div style={{ width: '100%' }}>{content}</div>
      </Tooltip>
    );
  }

  return content;
}
