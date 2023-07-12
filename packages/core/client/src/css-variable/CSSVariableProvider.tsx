import { useEffect } from 'react';
import { useToken } from '../style';

const CSSVariableProvider = ({ children }) => {
  const { token } = useToken();

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
  ]);

  return children;
};

CSSVariableProvider.displayName = 'CSSVariableProvider';

export default CSSVariableProvider;
