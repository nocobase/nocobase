import { useEffect } from 'react';
import { useToken } from '../style';

const CSSVariableProvider = ({ children }) => {
  const { token } = useToken();

  useEffect(() => {
    document.body.style.setProperty('--nb-spacing', `${token.marginLG}px`);
    document.body.style.setProperty('--nb-designer-offset', `${token.marginXS}px`);
    document.body.style.setProperty('--nb-header-height', `${token.sizeXXL - 2}px`);
    document.body.style.setProperty('--nb-box-bg', token.colorBgLayout);
  }, [token.marginLG, token.colorBgLayout, token.sizeXXL]);

  return children;
};

CSSVariableProvider.displayName = 'CSSVariableProvider';

export default CSSVariableProvider;
