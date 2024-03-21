import { TinyColor } from '@ctrl/tinycolor';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  const colorFillAlterSolid = new TinyColor(token.colorFillAlter)
    .onBackground(token.colorBgContainer)
    .toHexShortString();

  return {
    calendarheader: css`
      color: ${token.colorText};
      fill: ${colorFillAlterSolid};
      stroke-width: 1.4;
      background: ${colorFillAlterSolid};
      border-bottom: 1px solid ${token.colorBorderSecondary};
    `,
    nbGanttCalendar: css`
      .calendarbottomtext: {
        textanchor: middle;
        fill: ${token.colorText};
        webkittouchcallout: none;
        webkituserselect: none;
        mozuserselect: none;
        msuserselect: none;
        userselect: none;
        pointerevents: none;
        font-weight: 500;
      }
      .calendartoptick: {
        stroke: ${token.colorBorderSecondary};
        stroke-width: 0;
      }
      .calendartoptext: {
        textanchor: middle;
        webkittouchcallout: none;
        webkituserselect: none;
        mozuserselect: none;
        msuserselect: none;
        userselect: none;
        pointerevents: none;
        font-weight: 500;
        fill: ${token.colorText};
      }
    `,
  };
});

export default useStyles;
