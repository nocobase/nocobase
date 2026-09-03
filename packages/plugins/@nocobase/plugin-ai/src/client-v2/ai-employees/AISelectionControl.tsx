/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { theme } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../locale';
import { aiSelection } from './stores/ai-selection';
import { dialogController } from './stores/dialog-controller';

export const AISelectionControl: React.FC = observer(() => {
  const t = useT();
  const { token } = theme.useToken();
  const selectable = aiSelection.selectable;

  if (!selectable) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: token.marginXL,
        transform: 'translateX(-50%)',
        zIndex: 1101,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        columnGap: token.paddingSM,
        minWidth: token.controlHeightLG * 4,
        maxWidth: `calc(100vw - ${token.marginXL * 2}px)`,
        minHeight: token.controlHeightLG,
        paddingBlock: token.paddingXXS,
        paddingInline: token.paddingSM,
        boxSizing: 'border-box',
        background: token.colorBgElevated,
        border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowSecondary,
        borderRadius: token.borderRadiusLG,
      }}
    >
      <span
        style={{
          display: 'block',
          minWidth: 0,
          fontWeight: token.fontWeightStrong,
          fontSize: token.fontSizeSM,
          color: token.colorTextSecondary,
          lineHeight: token.lineHeightSM,
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {t('Picking block')}
      </span>
      <button
        type="button"
        style={{
          color: token.colorError,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: token.controlHeightSM,
          height: token.controlHeightSM,
          padding: 0,
          margin: 0,
          background: 'transparent',
          border: 0,
          borderRadius: token.borderRadiusSM,
          cursor: 'pointer',
          fontSize: token.fontSizeSM,
          lineHeight: 1,
        }}
        aria-label={t('Cancel')}
        onClick={() => {
          aiSelection.stopSelect();
          dialogController.resume();
        }}
      >
        <CloseCircleOutlined style={{ display: 'block', fontSize: token.fontSizeLG }} />
      </button>
    </div>
  );
});

AISelectionControl.displayName = 'AISelectionControl';
