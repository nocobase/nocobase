import { createStyles } from 'antd-style';
import { genStyleHook } from '../../../schema-component/antd/__builtins__';

export const useStyles = createStyles(({ token }) => {
  return {
    nbGroupTitle: {
      color: token.colorTextDescription,
      height: token.controlHeightLG,
      lineHeight: `${token.controlHeightLG}px`,
    },
    nbMenuItem: {
      margin: token.marginXXS,
      paddingLeft: token.padding,
      paddingRight: token.paddingSM,
      height: token.controlHeightLG,
      lineHeight: `${token.controlHeightLG}px`,
      color: token.colorText,
      cursor: 'pointer',

      '&:hover': {
        borderRadius: token.borderRadiusLG,
        backgroundColor: token.colorBgTextHover,
      },
    },
    nbMenuItemContent: {
      marginLeft: token.marginXS,
    },
  };
});

export const useGlobalStyles = genStyleHook('nb-schema-initializer', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      '.ant-menu': {
        background: 'transparent',
        borderInlineEnd: 'none !important',
      },
    },
  };
});
