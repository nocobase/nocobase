import { createStyles } from 'antd-style';
import { genStyleHook } from '../../../schema-component/antd/__builtins__';

export const useLocalStyle = createStyles(({ token }) => {
  return {
    itemContent: {
      marginLeft: token.marginXS,
    },
  };
});

export const useStyles = genStyleHook('nb-schema-initializer', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      '.ant-menu': {
        background: 'transparent',
        borderInlineEnd: 'none !important',
      },
      ':not(.ant-menu)': {
        [`${componentCls}-group-title`]: {
          color: token.colorTextDescription,
          height: token.controlHeightLG,
          lineHeight: `${token.controlHeightLG}px`,
        },
        [`${componentCls}-menu-item`]: {
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
      },
    },
  };
});
