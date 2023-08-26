import { genStyleHook } from '../../../__builtins__';

const useStyles = genStyleHook('nb-grid-other', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '&.scrollWrapper': {
        overflow: 'auto',
        position: 'absolute',
        bottom: '-4px',
        maxWidth: '100%',
        scrollbarWidth: 'thin',
        height: '1.2rem',
        '&::-webkit-scrollbar': { width: 8, height: 8 },
        '&::-webkit-scrollbar-corner': { background: 'transparent' },
        '&::-webkit-scrollbar-track': { background: 'var(--colorBgScrollTrack)' },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--colorBgScrollBar)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'var(--colorBgScrollBarHover)',
        },
        '&::-webkit-scrollbar-thumb:active': {
          background: 'var(--colorBgScrollBarActive)',
        },
      },

      '.horizontalScroll': {
        height: 1,
      },

      '&.tooltipDefaultContainer': {
        padding: '12px',
        backgroundColor: token.colorBgElevated,
        backgroundClip: 'padding-box',
        borderRadius: token.borderRadius,
        boxShadow: token.boxShadow,
        b: { display: 'block', marginBottom: token.marginXS },

        '.tooltipDefaultContainerParagraph': {
          fontSize: token.fontSizeSM,
          marginBottom: token.marginXXS + (token.marginXS - token.marginXXS),
          color: token.colorText,
        },
      },

      '&.tooltipDetailsContainer': {
        position: 'absolute',
        display: 'flex',
        flexShrink: 0,
        pointerEvents: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
      },

      '&.tooltipDetailsContainerHidden': {
        visibility: 'hidden',
        position: 'absolute',
        display: 'flex',
        pointerEvents: 'none',
      },

      '&.verticalScroll': {
        overflow: 'hidden auto',
        width: '1rem',
        flexShrink: 0,
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': { width: 8, height: 8 },
        '&::-webkit-scrollbar-corner': { background: 'transparent' },
        '&::-webkit-scrollbar-track': { background: 'var(--colorBgScrollTrack)' },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--colorBgScrollBar)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'var(--colorBgScrollBarHover)',
        },
        '&::-webkit-scrollbar-thumb:active': {
          background: 'var(--colorBgScrollBarActive)',
        },
      },
    },
  };
});

export default useStyles;
