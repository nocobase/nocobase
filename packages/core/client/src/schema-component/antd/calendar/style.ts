import { genStyleHook } from './../__builtins__';

export default genStyleHook('nb-calendar', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.rbc-btn': {
        color: 'inherit',
        font: 'inherit',
        margin: 0,
      },

      'button.rbc-btn': {
        overflow: 'visible',
        textTransform: 'none',
        '-webkit-appearance': 'button',
        cursor: 'pointer',
      },

      'button[disabled].rbc-btn': {
        cursor: 'not-allowed',
      },

      'button.rbc-input::-moz-focus-inner': {
        border: 0,
        padding: 0,
      },

      '.rbc-calendar': {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        height: '100%',
      },

      [`.rbc-calendar *,
      .rbc-calendar *:before,
      .rbc-calendar *:after`]: {
        boxSizing: 'inherit',
      },

      [`.rbc-abs-full,
      .rbc-row-bg`]: {
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },

      [`.rbc-ellipsis,
      .rbc-event-label,
      .rbc-row-segment .rbc-event-content,
      .rbc-show-more`]: {
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },

      '.rbc-rtl': {
        direction: 'rtl',
      },

      '.rbc-off-range': {
        color: 'rgba(0, 0, 0, 0.25)',
      },

      '.rbc-off-range-bg': {
        // background: #e6e6e6,
      },

      '.rbc-header': {
        // font-size: 16px,
        overflow: 'hidden',
        flex: '1 0 0%',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        padding: '4px 12px',
        verticalAlign: 'middle',
        // font-weight: 500,
        minHeight: '32px',
        color: 'rgba(0, 0, 0, 0.85)',
        margin: '0 4px',
        borderBottom: '2px solid #f0f0f0',
      },
      '.rbc-header + .rbc-header': {
        // border-left: 1px solid #f0f0f0,
      },
      '.rbc-rtl .rbc-header + .rbc-header': {
        borderLeftWidth: 0,
        borderRight: '1px solid #f0f0f0',
      },
      [`.rbc-header > a,
      .rbc-header > a:active,
      .rbc-header > a:visited`]: {
        color: 'inherit',
        textDecoration: 'none',
      },

      '.rbc-row-content': {
        position: 'relative',
        userSelect: 'none',
        '-webkit-user-select': 'none',
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
        /* Hide scrollbar for Chrome, Safari and Opera */
        '-ms-overflow-style': 'none',
        /* IE and Edge */
        scrollbarWidth: 'none',
        /* Firefox */
      },
      '.rbc-row-content-scrollable .rbc-row-content-scroll-container::-webkit-scrollbar': {
        display: 'none',
      },

      '.rbc-toolbar': {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '10px',
        fontSize: '16px',
      },
      '.rbc-toolbar .rbc-toolbar-label': {
        flexGrow: 1,
        padding: '0 10px',
        textAlign: 'center',
      },
      '.rbc-toolbar button': {
        outline: 'none',
        fontSize: '14px',
        lineHeight: 1.5715,
        height: '32px',
        color: '#373a3c',
        display: 'inline-block',
        margin: 0,
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        background: 'none',
        backgroundImage: 'none',
        border: '1px solid #d9d9d9',
        padding: '4px 15px',
        borderRadius: '2px',
        whiteSpace: 'nowrap',
      },
      [`.rbc-toolbar button:active,
      .rbc-toolbar button.rbc-active`]: {
        // background-image: none,
        // box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125),
        // background-color: #e6e6e6,
        zIndex: 2,
        color: '#1890ff',
        borderColor: '#1890ff',
      },
      [`.rbc-toolbar button:active:hover,
      .rbc-toolbar button:active:focus,
      .rbc-toolbar button.rbc-active:hover,
      .rbc-toolbar button.rbc-active:focus`]: {
        // color: #373a3c,
        // background-color: #d4d4d4,
        // border-color: #8c8c8c,
        zIndex: 2,
        color: '#40a9ff',
        borderColor: '#40a9ff',
      },
      // .rbc-toolbar button:focus {
      //   color: #373a3c,
      //   background-color: #e6e6e6,
      //   border-color: #adadad, },
      '.rbc-toolbar button:hover': {
        // color: #373a3c,
        // background-color: #e6e6e6,
        zIndex: 2,
        color: '#40a9ff',
        borderColor: '#40a9ff',
      },

      '.rbc-btn-group': {
        display: 'inline-block',
        whiteSpace: 'nowrap',
      },
      '.rbc-btn-group > button:first-child:not(:last-child)': {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },
      '.rbc-btn-group > button:last-child:not(:first-child)': {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },
      '.rbc-rtl .rbc-btn-group > button:first-child:not(:last-child)': {
        borderRadius: '4px',
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },
      '.rbc-rtl .rbc-btn-group > button:last-child:not(:first-child)': {
        borderRadius: '4px',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },
      '.rbc-btn-group > button:not(:first-child):not(:last-child)': {
        borderRadius: 0,
      },
      '.rbc-btn-group button + button': {
        marginLeft: '-1px',
      },
      '.rbc-rtl .rbc-btn-group button + button': {
        marginLeft: 0,
        marginRight: '-1px',
      },
      [`.rbc-btn-group + .rbc-btn-group,
      .rbc-btn-group + button`]: {
        marginLeft: '10px',
      },

      '.rbc-event': {
        border: 'none',
        boxSizing: 'border-box',
        boxShadow: 'none',
        margin: 0,
        padding: '2px 5px',
        backgroundColor: 'rgba(240, 240, 240, 0.65)',
        borderRadius: '2px',
        // color: #1890ff,
        cursor: 'pointer',
        fontSize: '12px',
        width: '100%',
        textAlign: 'left',
        '&:hover': {
          backgroundColor: '#e6f7ff',
          color: '#1890ff',
        },
      },
      '.rbc-slot-selecting .rbc-event': {
        cursor: 'inherit',
        pointerEvents: 'none',
      },
      '.rbc-event.rbc-selected': {
        backgroundColor: '#e6f7ff',
        color: '#1890ff',
      },
      '.rbc-event:focus': {
        // outline: 5px auto #3b99fc,
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

      '.rbc-row': {
        display: 'flex',
        flexDirection: 'row',
      },

      '.rbc-row-segment': {
        padding: '0 4px 1px 4px',
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

      '.rbc-month-view': {
        position: 'relative',
        // border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 0 0',
        width: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        height: '68vh',
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
        flexBasis: '0px',
        overflow: 'hidden',
        height: '100%',
      },

      '.rbc-month-row + .rbc-month-row': {
        // borderTop: '1px solid #f0f0f0',
      },

      '.rbc-date-cell': {
        // cursor: 'pointer',
        flex: '1 1 0',
        minWidth: 0,
        paddingLeft: '12px',
        paddingTop: '4px',
      },

      '.rbc-date-cell.rbc-now span': {
        // fontWeight: 'bold',
        color: '#1890ff',
      },

      '.rbc-date-cell a, .rbc-date-cell a:active, .rbc-date-cell a:visited': {
        color: 'inherit',
        textDecoration: 'none',
      },

      '.rbc-date-cell a:hover': {
        color: '#1890ff',
      },

      '.rbc-date-cell .rbc-date-solar': {
        fontWeight: 500,
      },

      '.rbc-date-cell .rbc-date-lunar': {
        paddingLeft: '12px',
      },

      '.rbc-date-cell:not(.rbc-off-range) .rbc-date-lunar': {
        color: '#aaa',
      },

      '.rbc-date-cell .rbc-date-lunar:hover': {
        color: 'inherit',
      },

      '.rbc-row-bg': {
        display: 'flex',
        flexDirection: 'row',
        flex: '1 0 0',
        overflow: 'hidden',
      },

      '.rbc-day-bg': {
        flex: '1 0 0%',
        // borderTop: '2px solid #f0f0f0',
        margin: '0 4px',
        '&:hover': {
          background: '#f5f5f5',
        },
        // cursor: 'pointer',
      },

      '.rbc-month-view .rbc-day-bg': {
        borderTop: '2px solid #f0f0f0',
      },

      '.rbc-month-view .rbc-today': {
        borderColor: '#1890ff !important',
        backgroundColor: '#e6f7ff !important',
      },

      '.rbc-month-view .rbc-header': {
        borderBottom: '0 !important',
      },

      '.rbc-day-bg + .rbc-day-bg': {
        // marginLeft: 8,
        // borderLeft: '1px solid #f0f0f0',
      },
      '.rbc-rtl .rbc-day-bg + .rbc-day-bg': {
        // borderLeftWidth: 0,
        // borderRight: '1px solid #f0f0f0',
      },
      '.rbc-overlay': {
        position: 'absolute',
        zIndex: 50,
        marginTop: 5,
        borderRadius: 2,
        // border: '1px solid #e5e5e5',
        backgroundColor: '#fff',
        boxShadow:
          '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        padding: '12px 16px',
      },
      '.rbc-overlay > * + *': {
        marginTop: 1,
      },
      '.rbc-overlay-header': {
        fontWeight: 500,
        minHeight: 32,
        borderBottom: '1px solid #f0f0f0',
        margin: '-12px -16px 12px -16px',
        padding: '5px 16px 4px',
      },
      '.rbc-agenda-view': {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 0 0',
        overflow: 'auto',
      },
      '.rbc-agenda-view table.rbc-agenda-table': {
        width: '100%',
        border: '1px solid #f0f0f0',
        borderSpacing: 0,
        borderCollapse: 'collapse',
      },
      '.rbc-agenda-view table.rbc-agenda-table tbody > tr > td': {
        padding: '5px 10px',
        verticalAlign: 'top',
      },
      '.rbc-agenda-view table.rbc-agenda-table .rbc-agenda-time-cell': {
        paddingLeft: 15,
        paddingRight: 15,
        textTransform: 'lowercase',
      },
      '.rbc-agenda-view table.rbc-agenda-table tbody > tr > td + td': {
        borderLeft: '1px solid #f0f0f0',
      },
      '.rbc-rtl .rbc-agenda-view table.rbc-agenda-table tbody > tr > td + td': {
        borderLeftWidth: 0,
        borderRight: '1px solid #f0f0f0',
      },
      '.rbc-agenda-view table.rbc-agenda-table tbody > tr + tr': {
        borderTop: '1px solid #f0f0f0',
      },
      '.rbc-agenda-view table.rbc-agenda-table thead > tr > th': {
        padding: '3px 5px',
        textAlign: 'left',
        borderBottom: '1px solid #f0f0f0',
      },
      '.rbc-rtl .rbc-agenda-view table.rbc-agenda-table thead > tr > th': {
        textAlign: 'right',
      },
      '.rbc-agenda-time-cell': {
        textTransform: 'lowercase',
      },
      '.rbc-agenda-time-cell .rbc-continues-after:after': {
        content: ' »',
      },
      '.rbc-agenda-time-cell .rbc-continues-prior:before': {
        content: '« ',
      },
      '.rbc-agenda-date-cell, .rbc-agenda-time-cell': {
        whiteSpace: 'nowrap',
      },
      '.rbc-agenda-event-cell': {
        width: '100%',
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
        borderBottom: '1px solid #f0f0f0',
        minHeight: '40px',
        lineHeight: '39px',
        display: 'flex',
        flexFlow: 'column nowrap',
        // cursor: 'pointer',
        '&:hover': {
          background: '#f0f0f0',
        },
      },

      '.rbc-time-gutter, .rbc-header-gutter': {
        flex: 'none',
      },
      '.rbc-label': {
        padding: '0 5px',
      },
      '.rbc-day-slot': {
        position: 'relative',
      },
      '.rbc-day-slot .rbc-events-container': {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        marginRight: 10,
        top: 0,
      },
      '.rbc-day-slot .rbc-events-container.rbc-rtl': {
        left: 10,
        right: 0,
      },
      '.rbc-day-slot .rbc-event': {
        border: '1px solid #265985',
        display: 'flex',
        maxHeight: '100%',
        minHeight: 20,
        flexFlow: 'column wrap',
        alignItems: 'flex-start',
        overflow: 'hidden',
        position: 'absolute',
      },
      '.rbc-day-slot .rbc-event-label': {
        flex: 'none',
        paddingRight: 5,
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
      '.rbc-day-slot .rbc-time-slot': {
        // borderTop: '1px solid #f7f7f7',
      },
      '.rbc-time-header-gutter': {
        lineHeight: '40px',
      },
      '.rbc-time-header-cell': {
        minHeight: '32px !important',
      },
      '.rbc-time-header-cell .rbc-header': {
        display: 'flex',
      },
      '.rbc-time-header-cell .rbc-header.rbc-today': {
        borderColor: '#1890ff',
        backgroundColor: '#e6f7ff',
        color: '#1890ff',
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
      '.rbc-time-header-cell .rbc-date-lunar': {
        marginLeft: '4px',
      },
      '.rbc-time-header-cell .rbc-header:not(.rbc-today) .rbc-date-lunar': {
        color: '#aaa',
      },
      '.rbc-calendar.view-week .rbc-time-header-cell': {
        marginTop: '-32px',
        marginBottom: '4px',
      },
      '.rbc-calendar.view-week .rbc-time-view': {
        paddingTop: '32px',
        borderTop: 0,
      },
      '.rbc-calendar.view-week .rbc-header': {
        padding: '4px 8px',
      },
      '.rbc-calendar.view-week .rbc-time-header-content': {
        padding: '4px 0',
      },
      '.rbc-calendar.view-week .rbc-time-header-gutter': {
        padding: 0,
        paddingTop: '2px',
        '> div': {
          borderTop: '2px solid #f0f0f0',
          padding: '0 5px',
        },
      },
      '.rbc-time-view-resources .rbc-time-gutter, .rbc-time-view-resources .rbc-time-header-gutter': {
        position: 'sticky',
        left: 0,
        backgroundColor: 'white',
        borderRight: '1px solid #f0f0f0',
        zIndex: 10,
        marginRight: '-1px',
      },
      '.rbc-time-view-resources .rbc-time-header': {
        overflow: 'hidden',
      },

      '.rbc-time-view-resources .rbc-time-header-content': {
        minWidth: 'auto',
        flex: '1 0 0',
        flexBasis: '0px',
      },

      '.rbc-time-view-resources .rbc-time-header-cell-single-day': {
        display: 'none',
      },

      '.rbc-time-view-resources .rbc-day-slot': {
        minWidth: '140px',
      },

      '.rbc-time-view-resources .rbc-header, .rbc-time-view-resources .rbc-day-bg': {
        width: '140px',
        flex: '1 1 0',
        flexBasis: '0 px',
      },

      '.rbc-time-header-content + .rbc-time-header-content': {
        marginLeft: '-1px',
      },

      '.rbc-time-slot': {
        flex: '1 0 0',
      },

      '.rbc-time-slot.rbc-now': {
        fontWeight: 'bold',
      },

      '.rbc-day-header': {
        textAlign: 'center',
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

      '.rbc-time-view': {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        borderTop: '1px solid #f0f0f0',
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
        borderLeft: '1px solid #f0f0f0',
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
        borderRight: '1px solid #f0f0f0',
      },

      '.rbc-rtl .rbc-time-header.rbc-overflowing': {
        borderRightWidth: '0',
        borderLeft: '1px solid #f0f0f0',
      },

      '.rbc-time-header > .rbc-row:first-child': {
        borderBottom: '1px solid #f0f0f0',
      },

      '.rbc-time-header > .rbc-row.rbc-row-resource': {
        borderBottom: '1px solid #f0f0f0',
      },

      '.rbc-time-header-cell-single-day': {
        display: 'none',
      },

      '.rbc-time-header-content': {
        flex: '1',
        // display: flex,
        minWidth: '0',
        flexDirection: 'column',
        // border-left: 1px solid #f0f0f0,
      },

      '.rbc-rtl .rbc-time-header-content': {
        borderLeftWidth: '0',
        borderRight: '1px solid #f0f0f0',
      },

      '.rbc-time-header-content > .rbc-row.rbc-row-resource': {
        borderBottom: '1px solid #f0f0f0',
        flexShrink: '0',
      },

      '.rbc-time-content': {
        display: 'flex',
        flex: '1 0 0%',
        alignItems: 'flex-start',
        width: '100%',
        borderTop: '1px solid #f0f0f0',
        overflowY: 'auto',
        position: 'relative',
      },

      '.rbc-time-content > .rbc-time-gutter': {
        flex: 'none',
      },
      '.rbc-time-content > * + * > *': {
        // 'border-left': '1px solid #f0f0f0',
      },
      '.rbc-rtl .rbc-time-content > * + * > *': {
        'border-left-width': 0,
        'border-right': '1px solid #f0f0f0',
      },
      '.rbc-time-content > .rbc-day-slot': {
        width: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
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
      '@media only screen and (max-width: 800px)': {
        '.view-type-calendar .action-buttons': {
          position: 'relative !important',
          left: '0 !important',
        },
        '.view-type-calendar .action-buttons .filter-action-button': {
          left: '0 !important',
        },
        '.rbc-toolbar .rbc-toolbar-label': {
          position: 'absolute',
          top: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
        },
        '.rbc-toolbar': {
          justifyContent: 'space-between !important',
        },
        '.rbc-header': {
          padding: '4px !important',
        },
      } as any,
    },
  };
});
