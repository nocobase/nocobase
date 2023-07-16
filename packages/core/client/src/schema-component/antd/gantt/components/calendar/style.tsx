import { TinyColor } from '@ctrl/tinycolor';
import { genStyleHook } from '../../../__builtins__';

const useStyles = genStyleHook('nb-gantt-calendar', (token) => {
  const { componentCls } = token;
  const colorFillAlterSolid = new TinyColor(token.colorFillAlter)
    .onBackground(token.colorBgContainer)
    .toHexShortString();

  return {
    [componentCls]: {
      '.calendarBottomText': {
        textAnchor: 'middle',
        fill: token.colorText,
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        pointerEvents: 'none',
        fontWeight: 500,
      },

      '.calendarTopTick': {
        stroke: token.colorBorderSecondary,
        strokeWidth: 0,
      },

      '.calendarTopText': {
        textAnchor: 'middle',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        pointerEvents: 'none',
        fontWeight: 500,
        fill: token.colorText,
      },

      '.calendarHeader': {
        color: token.colorText,
        fill: colorFillAlterSolid,
        strokeWidth: 1.4,
        background: colorFillAlterSolid,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      },
    },
  };
});

export default useStyles;
