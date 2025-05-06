/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TinyColor } from '@ctrl/tinycolor';
import { useEffect } from 'react';
import { defaultTheme } from '../global-theme';
import { useToken } from '../style';

export const CSSVariableProvider = ({ children }) => {
  const { token } = useToken();

  const colorBgScrollTrack = token.colorFillTertiary;
  const colorBgScrollBar = new TinyColor(token.colorFill).onBackground(token.colorFillSecondary).toHexShortString();
  const colorBgScrollBarHover = new TinyColor(token.colorFill).onBackground(token.colorFill).toHexShortString();
  const colorBgScrollBarActive = new TinyColor(token.colorFill)
    .onBackground(token.colorFill)
    .onBackground(token.colorFill)
    .toHexShortString();

  useEffect(() => {
    document.body.style.setProperty('--nb-spacing', `${token.marginLG}px`);
    document.body.style.setProperty('--nb-designer-offset', `${token.marginXS}px`);
    document.body.style.setProperty('--nb-header-height', `${token.sizeXXL - 2}px`);
    document.body.style.setProperty('--nb-box-bg', token.colorBgLayout);
    document.body.style.setProperty('--nb-box-bg', token.colorBgLayout);
    document.body.style.setProperty('--controlHeightLG', `${token.controlHeightLG}px`);
    document.body.style.setProperty('--paddingContentVerticalSM', `${token.paddingContentVerticalSM}px`);
    document.body.style.setProperty('--marginSM', `${token.marginSM}px`);
    document.body.style.setProperty('--colorInfoBg', token.colorInfoBg);
    document.body.style.setProperty('--colorInfoBorder', token.colorInfoBorder);
    document.body.style.setProperty('--colorWarningBg', token.colorWarningBg);
    document.body.style.setProperty('--colorWarningBorder', token.colorWarningBorder);
    document.body.style.setProperty('--colorText', token.colorText);
    document.body.style.setProperty('--colorTextHeaderMenu', token.colorTextHeaderMenu);
    document.body.style.setProperty('--colorPrimaryText', token.colorPrimaryText);
    document.body.style.setProperty('--colorPrimaryTextActive', token.colorPrimaryTextActive);
    document.body.style.setProperty('--colorPrimaryTextHover', token.colorPrimaryTextHover);
    document.body.style.setProperty('--colorBgScrollTrack', colorBgScrollTrack);
    document.body.style.setProperty('--colorBgScrollBar', colorBgScrollBar);
    document.body.style.setProperty('--colorBgScrollBarHover', colorBgScrollBarHover);
    document.body.style.setProperty('--colorBgScrollBarActive', colorBgScrollBarActive);
    document.body.style.setProperty('--colorSettings', token.colorSettings || defaultTheme.token.colorSettings);
    document.body.style.setProperty('--colorBgSettingsHover', token.colorBgSettingsHover);
    document.body.style.setProperty('--colorTemplateBgSettingsHover', token.colorTemplateBgSettingsHover);
    document.body.style.setProperty('--colorBorderSettingsHover', token.colorBorderSettingsHover);
    document.body.style.setProperty('--colorBgMenuItemSelected', token.colorBgHeaderMenuActive);

    // 设置登录页面的背景色
    document.body.style.setProperty('background-color', token.colorBgContainer);
  }, [
    colorBgScrollBar,
    colorBgScrollBarActive,
    colorBgScrollBarHover,
    colorBgScrollTrack,
    token.colorBgContainer,
    token.colorBgLayout,
    token.colorBgSettingsHover,
    token.colorTemplateBgSettingsHover,
    token.colorBorderSettingsHover,
    token.colorInfoBg,
    token.colorInfoBorder,
    token.colorPrimaryText,
    token.colorPrimaryTextActive,
    token.colorPrimaryTextHover,
    token.colorSettings,
    token.colorText,
    token.colorWarningBg,
    token.colorWarningBorder,
    token.controlHeightLG,
    token.marginLG,
    token.marginSM,
    token.marginXS,
    token.paddingContentVerticalSM,
    token.sizeXXL,
    token.colorTextHeaderMenu,
  ]);

  return children;
};

CSSVariableProvider.displayName = 'CSSVariableProvider';

export default CSSVariableProvider;
