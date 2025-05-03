/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { HighlightOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { FC } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '..';
import { useToken } from '../../style';
import { useMobileLayout } from '../../route-switch/antd/admin-layout';

const designableStyle = {
  backgroundColor: 'var(--colorSettings) !important',
};

const unDesignableStyle = {
  backgroundColor: 'transparent',
};

export const DesignableSwitch: FC<{ style?: React.CSSProperties }> = (props) => {
  const { designable, setDesignable } = useDesignable();
  const { t } = useTranslation();
  const { token } = useToken();
  const style = designable ? designableStyle : unDesignableStyle;
  const { isMobileLayout } = useMobileLayout();

  // 快捷键切换编辑状态
  useHotkeys('Ctrl+Shift+U', () => setDesignable(!designable), [designable]);

  if (isMobileLayout) {
    return null;
  }

  return (
    <Tooltip title={t('UI Editor')}>
      <Button
        data-testid={'ui-editor-button'}
        // selected={designable}
        icon={<HighlightOutlined style={{ color: token.colorTextHeaderMenu }} />}
        title={t('UI Editor')}
        // subtitle={'Ctrl+Shift+U'}
        style={{ ...style, ...props.style }}
        onClick={() => {
          setDesignable(!designable);
        }}
      />
    </Tooltip>
  );
};
