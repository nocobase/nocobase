/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from 'antd-style';

export default createStyles(({ token }) => {
  return {
    calendar: {
      height: 'var(--nb-calendar-height)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      marginBottom: token.marginSM,
      '.nb-calendar-body': {
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'hidden',
      },
      '.rbc-calendar': {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        height: '100%',
      },
      '.rbc-calendar *, .rbc-calendar *:before, .rbc-calendar *:after': {
        boxSizing: 'inherit',
      },
      '.rbc-rtl': {
        direction: 'rtl',
      },
      '.rbc-abs-full, .rbc-row-bg': {
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      '.rbc-ellipsis, .rbc-event-label, .rbc-row-segment .rbc-event-content, .rbc-show-more': {
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      '.rbc-header': {
        overflow: 'hidden',
        flex: '1 0 0%',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        padding: `${token.paddingXXS}px ${token.paddingSM}px`,
        verticalAlign: 'middle',
        minHeight: token.sizeXL,
        color: token.colorText,
        margin: `0 ${token.marginXXS}px`,
        borderBottom: `${token.lineWidthBold}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-header > a, .rbc-header > a:active, .rbc-header > a:visited': {
        color: 'inherit',
        textDecoration: 'none',
      },
      '.rbc-rtl .rbc-header + .rbc-header': {
        borderLeftWidth: 0,
        borderRight: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-button-link': {
        color: 'inherit',
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
      },
      '.rbc-row': {
        display: 'flex',
        flexDirection: 'row',
      },
      '.rbc-row-content': {
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        zIndex: 4,
      },
      '.rbc-row-content-scrollable': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      },
      '.rbc-row-content-scrollable .rbc-row-content-scroll-container': {
        height: '100%',
        overflowY: 'scroll',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      },
      '.rbc-row-content-scrollable .rbc-row-content-scroll-container::-webkit-scrollbar': {
        display: 'none',
      },
      '.rbc-row-segment': {
        padding: `0 ${token.paddingXXS}px ${token.lineWidth}px`,
      },
      '.rbc-month-view': {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 0 0',
        width: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        '.rbc-day-bg': {
          borderTop: `${token.lineWidthBold}px ${token.lineType} ${token.colorBorderSecondary}`,
        },
        '.rbc-today': {
          borderColor: token.colorPrimaryBorder,
          backgroundColor: token.colorPrimaryBg,
        },
        '.rbc-header': {
          borderBottom: 0,
        },
      },
      '.rbc-month-header': {
        display: 'flex',
        flexDirection: 'row',
      },
      '.rbc-month-row': {
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        flex: '1 0 0',
        flexBasis: 0,
        overflow: 'hidden',
        height: '100%',
      },
      '.rbc-row-bg': {
        display: 'flex',
        flexDirection: 'row',
        flex: '1 0 0',
        overflow: 'hidden',
      },
      '.rbc-day-bg': {
        flex: '1 0 0%',
        margin: `0 ${token.marginXXS}px`,
        '&:hover': {
          background: token.colorFillQuaternary,
        },
      },
      '.rbc-date-cell': {
        flex: '1 1 0',
        minWidth: 0,
        paddingLeft: token.paddingSM,
        paddingTop: token.paddingXXS,
      },
      '.rbc-date-cell.rbc-now span, .rbc-date-cell a:hover': {
        color: token.colorPrimary,
      },
      '.rbc-date-cell a, .rbc-date-cell a:active, .rbc-date-cell a:visited': {
        color: 'inherit',
        textDecoration: 'none',
      },
      '.rbc-date-cell .rbc-date-solar': {
        fontWeight: token.fontWeightStrong,
      },
      '.rbc-date-solar-week': {
        fontSize: token.fontSize,
      },
      '.rbc-date-cell .rbc-date-lunar': {
        paddingLeft: token.paddingSM,
      },
      '.rbc-date-cell:not(.rbc-off-range) .rbc-date-lunar, .rbc-time-header-cell .rbc-header:not(.rbc-today) .rbc-date-lunar':
        {
          color: token.colorTextTertiary,
        },
      '.rbc-off-range': {
        color: token.colorTextDisabled,
      },
      '.rbc-event': {
        border: 'none',
        boxSizing: 'border-box',
        boxShadow: 'none',
        margin: 0,
        padding: '2px 5px',
        backgroundColor: token.colorBorderSecondary,
        borderRadius: token.borderRadiusXS,
        color: token.colorTextSecondary,
        cursor: 'pointer',
        fontSize: token.fontSizeSM,
        width: '100%',
        textAlign: 'left',
        '&:hover': {
          backgroundColor: token.colorPrimaryBg,
          color: token.colorPrimaryText,
        },
      },
      '.rbc-event.rbc-selected': {
        backgroundColor: token.colorPrimaryBg,
        color: token.colorPrimaryText,
      },
      '.rbc-slot-selecting .rbc-event': {
        cursor: 'inherit',
        pointerEvents: 'none',
      },
      '.rbc-event-label': {
        fontSize: '80%',
      },
      '.rbc-event-overlaps': {
        boxShadow: '-1px 1px 5px 0px rgba(51, 51, 51, 0.5)',
      },
      '.rbc-event-continues-prior': {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },
      '.rbc-event-continues-after': {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },
      '.rbc-event-continues-earlier': {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      '.rbc-event-continues-later': {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      '.rbc-selected-cell': {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      },
      '.rbc-show-more': {
        zIndex: 4,
        fontWeight: 'bold',
        fontSize: '85%',
        height: 'auto',
        lineHeight: 'normal',
        color: 'inherit',
        padding: '2px 5px',
      },
      '.rbc-time-view': {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        minHeight: 0,
      },
      '.rbc-time-view .rbc-time-gutter': {
        whiteSpace: 'nowrap',
      },
      '.rbc-time-view .rbc-allday-cell': {
        boxSizing: 'content-box',
        width: '100%',
        height: '100%',
        position: 'relative',
      },
      '.rbc-time-view .rbc-allday-cell + .rbc-allday-cell': {
        borderLeft: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-time-view .rbc-allday-events': {
        position: 'relative',
        zIndex: 4,
      },
      '.rbc-time-view .rbc-row': {
        boxSizing: 'border-box',
        minHeight: '20px',
      },
      '.rbc-time-header': {
        display: 'flex',
        flex: '0 0 auto',
        flexDirection: 'row',
      },
      '.rbc-time-header.rbc-overflowing': {
        borderRight: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-rtl .rbc-time-header.rbc-overflowing': {
        borderRightWidth: 0,
        borderLeft: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-time-header > .rbc-row:first-child, .rbc-time-header > .rbc-row.rbc-row-resource': {
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-time-header-content': {
        flex: 1,
        minWidth: 0,
        flexDirection: 'column',
      },
      '.rbc-rtl .rbc-time-header-content': {
        borderLeftWidth: 0,
        borderRight: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-time-header-content + .rbc-time-header-content': {
        marginLeft: '-1px',
      },
      '.rbc-time-header-content > .rbc-row.rbc-row-resource': {
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        flexShrink: 0,
      },
      '.rbc-time-header-gutter, .rbc-header-gutter': {
        flex: 'none',
      },
      '.rbc-time-header-gutter': {
        lineHeight: '40px',
      },
      '.rbc-time-header-cell': {
        minHeight: '32px !important',
      },
      '.rbc-time-header-cell-single-day': {
        display: 'none',
      },
      '.rbc-time-header-cell .rbc-header': {
        display: 'flex',
      },
      '.rbc-time-header-cell .rbc-header.rbc-today': {
        borderColor: token.colorPrimaryBorder,
        backgroundColor: token.colorPrimaryBg,
        color: token.colorPrimaryText,
      },
      '.rbc-time-header-cell .rbc-header a': {
        display: 'flex',
        flexDirection: 'column',
      },
      '.rbc-time-header-cell .rbc-date-wrap': {
        display: 'flex',
        alignItems: 'center',
      },
      '.rbc-time-header-cell .rbc-date-solar': {
        fontSize: '18px',
      },
      '.rbc-time-header-cell .rbc-date-solar-week': {
        fontSize: '14px',
      },
      '.rbc-time-header-cell .rbc-date-lunar, .rbc-toolbar-lunar': {
        marginLeft: '4px',
      },
      '.rbc-calendar.view-week': {
        '.rbc-time-header-cell': {
          marginTop: '-32px',
          marginBottom: '4px',
        },
        '.rbc-time-view': {
          paddingTop: '32px',
          borderTop: 0,
        },
        '.rbc-header': {
          padding: '4px 8px',
        },
        '.rbc-time-header-content': {
          padding: '4px 0',
        },
        '.rbc-time-header-gutter': {
          padding: 0,
          paddingTop: '2px',
          '> div': {
            borderTop: `2px ${token.lineType} ${token.colorBorderSecondary}`,
            padding: '0 5px',
          },
        },
      },
      '.rbc-time-content': {
        display: 'flex',
        flex: '1 0 0%',
        alignItems: 'flex-start',
        width: '100%',
        borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        overflowY: 'auto',
        position: 'relative',
      },
      '.rbc-time-content > .rbc-time-gutter': {
        flex: 'none',
      },
      '.rbc-rtl .rbc-time-content > * + * > *': {
        borderLeftWidth: 0,
        borderRight: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      },
      '.rbc-time-content > .rbc-day-slot': {
        width: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      },
      '.rbc-time-slot': {
        flex: '1 0 0',
      },
      '.rbc-time-slot.rbc-now': {
        fontWeight: token.fontWeightStrong,
      },
      '.rbc-time-column': {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      },
      '.rbc-time-column .rbc-timeslot-group': {
        flex: 1,
      },
      '.rbc-timeslot-group': {
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        minHeight: '40px',
        lineHeight: '39px',
        display: 'flex',
        flexFlow: 'column nowrap',
        '&:hover': {
          background: '#f0f0f0',
        },
      },
      '.rbc-day-slot': {
        position: 'relative',
      },
      '.rbc-day-header': {
        textAlign: 'center',
      },
      '.rbc-day-slot .rbc-events-container': {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        marginRight: '10px',
        top: 0,
      },
      '.rbc-day-slot .rbc-events-container.rbc-rtl': {
        left: '10px',
        right: 0,
      },
      '.rbc-day-slot .rbc-event': {
        border: `${token.lineWidth}px ${token.lineType} ${token.colorPrimaryBorder}`,
        display: 'flex',
        maxHeight: '100%',
        minHeight: '20px',
        flexFlow: 'column wrap',
        alignItems: 'flex-start',
        overflow: 'hidden',
        position: 'absolute',
      },
      '.rbc-day-slot .rbc-event-label': {
        flex: 'none',
        paddingRight: '5px',
        width: 'auto',
      },
      '.rbc-day-slot .rbc-event-content': {
        width: '100%',
        flex: '1 1 0',
        wordWrap: 'break-word',
        lineHeight: 1,
        height: '100%',
        minHeight: '1em',
      },
      '.rbc-label': {
        padding: '0 5px',
      },
      '.rbc-slot-selection': {
        zIndex: 10,
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        fontSize: '75%',
        width: '100%',
        padding: '3px',
      },
      '.rbc-slot-selecting': {
        cursor: 'move',
      },
      '.rbc-current-time-indicator': {
        position: 'absolute',
        zIndex: 3,
        left: 0,
        right: 0,
        height: '1px',
        backgroundColor: '#74ad31',
        pointerEvents: 'none',
      },
    },
  };
});
