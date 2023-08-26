import { genStyleHook } from '../../../__builtins__';

const useStyles = genStyleHook('nb-grid-body', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.gridRow': {
        fill: token.colorBgContainer,
      },

      '.gridHeightRow': {
        fill: '#e6f7ff',
        borderColor: token.colorBorder,
      },

      '.gridRowLine': {
        stroke: token.colorBorderSecondary,
        strokeWidth: 0,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      },

      '.gridTick': {
        stroke: token.colorBorderSecondary,
      },
    },
  };
});

export default useStyles;
