/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { HighlightOutlined } from '@ant-design/icons';
import { observer, useFlowEngine } from '@nocobase/flow-engine';
import { Button, Tooltip, theme } from 'antd';
import React, { type CSSProperties } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import type { CustomToken } from '@nocobase/client-v2';

const activeStyle = (token: CustomToken): CSSProperties => ({
  backgroundColor: token.colorSettings,
});

const inactiveStyle: CSSProperties = {
  backgroundColor: 'transparent',
};

/**
 * v2 右上角 UI Editor 开关。
 */
export const DesignableSwitch = observer(() => {
  const flowEngine = useFlowEngine();
  const { t } = useTranslation(['client', '@nocobase/plugin-acl'], { nsMode: 'fallback' });
  const { token } = theme.useToken();
  const customToken = token as CustomToken;
  const designable = !!flowEngine.context.flowSettingsEnabled;
  const isMobileLayout = !!flowEngine.context.isMobileLayout;

  useHotkeys(
    'ctrl+shift+u',
    () => {
      if (isMobileLayout) {
        return;
      }

      if (designable) {
        flowEngine.flowSettings.disable();
        return;
      }

      flowEngine.flowSettings.enable();
    },
    [designable, flowEngine, isMobileLayout],
  );

  if (isMobileLayout) {
    return null;
  }

  return (
    <Tooltip title={t('UI Editor')}>
      <Button
        data-testid="ui-editor-button"
        icon={<HighlightOutlined style={{ color: customToken.colorTextHeaderMenu }} />}
        title={t('UI Editor')}
        style={designable ? activeStyle(customToken) : inactiveStyle}
        onClick={async () => {
          if (designable) {
            await flowEngine.flowSettings.disable();
            return;
          }

          await flowEngine.flowSettings.enable();
        }}
      />
    </Tooltip>
  );
});

DesignableSwitch.displayName = 'PluginAclV2DesignableSwitch';

export default DesignableSwitch;
