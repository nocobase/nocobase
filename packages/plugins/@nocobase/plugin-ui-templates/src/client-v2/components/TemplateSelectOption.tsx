/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { theme, Tooltip, Typography } from 'antd';

export function renderTemplateSelectLabel(name: React.ReactNode, maxWidth: React.CSSProperties['maxWidth'] = '100%') {
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

const TemplateSelectOptionContent: React.FC<{ option: TemplateSelectOptionRenderArg }> = ({ option }) => {
  const { token } = theme.useToken();
  const desc = option?.data?.description;
  const disabledReason = option?.data?.disabledReason;
  const isDisabled = !!disabledReason;
  const name = option?.data?.rawName || option?.label;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: token.marginXXS,
        paddingBlock: token.paddingXXS,
        maxWidth: '100%',
        width: '100%',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Typography.Text
        strong
        style={{
          maxWidth: '100%',
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
            fontSize: token.fontSizeSM,
            lineHeight: token.lineHeightSM,
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
      <Tooltip title={disabledReason} placement="right">
        <div style={{ width: '100%' }}>{content}</div>
      </Tooltip>
    );
  }

  return content;
};

export function renderTemplateSelectOption(option: TemplateSelectOptionRenderArg) {
  return <TemplateSelectOptionContent option={option} />;
}
