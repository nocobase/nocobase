import { TinyColor } from '@ctrl/tinycolor';
import { useEffect, useMemo } from 'react';
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

  const colorBgDrawer = useMemo(() => {
    const colorBgElevated = new TinyColor(token.colorBgElevated);
    return colorBgElevated.isDark() ? token.colorBgElevated : colorBgElevated.darken(4).toHexString();
  }, [token.colorBgElevated]);

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
    document.body.style.setProperty('--colorText', token.colorText);
    document.body.style.setProperty('--colorPrimaryText', token.colorPrimaryText);
    document.body.style.setProperty('--colorPrimaryTextActive', token.colorPrimaryTextActive);
    document.body.style.setProperty('--colorPrimaryTextHover', token.colorPrimaryTextHover);
    document.body.style.setProperty('--colorBgScrollTrack', colorBgScrollTrack);
    document.body.style.setProperty('--colorBgScrollBar', colorBgScrollBar);
    document.body.style.setProperty('--colorBgScrollBarHover', colorBgScrollBarHover);
    document.body.style.setProperty('--colorBgScrollBarActive', colorBgScrollBarActive);
    document.body.style.setProperty('--colorBgDrawer', colorBgDrawer);
    document.body.style.setProperty('--colorSettings', token.colorSettings || defaultTheme.token.colorSettings);
    document.body.style.setProperty('--colorBgSettingsHover', token.colorBgSettingsHover);
    document.body.style.setProperty('--colorBorderSettingsHover', token.colorBorderSettingsHover);

    // 设置登录页面的背景色
    document.body.style.setProperty('background-color', token.colorBgContainer);
  }, [
    token.marginLG,
    token.colorBgLayout,
    token.sizeXXL,
    token.marginXS,
    token.controlHeightLG,
    token.paddingContentVerticalSM,
    token.marginSM,
    token.colorInfoBg,
    token.colorInfoBorder,
    token.colorText,
    token.colorBgContainer,
    token.colorFillQuaternary,
    token.colorFillSecondary,
    token.colorFill,
    token.colorFillTertiary,
    colorBgScrollTrack,
    colorBgScrollBar,
    colorBgScrollBarHover,
    colorBgScrollBarActive,
    colorBgDrawer,
    token.colorPrimaryText,
    token.colorPrimaryTextActive,
    token.colorPrimaryTextHover,
    token.colorSettings,
    token.colorBgSettingsHover,
    token.colorBorderSettingsHover,
  ]);

  return children;
};

CSSVariableProvider.displayName = 'CSSVariableProvider';

export default CSSVariableProvider;
