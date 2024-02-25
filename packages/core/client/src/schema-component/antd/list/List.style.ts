import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-list', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      width: '100%',
      marginBottom: 0,
      // '.nb-action-bar:not(:empty)': { marginTop: token.marginXS },
      '&:hover': { '> .general-schema-designer': { display: 'block' } },
      '> .general-schema-designer': {
        position: 'absolute',
        zIndex: 999,
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'none',
        background: 'var(--colorBgSettingsHover)',
        border: '0',
        pointerEvents: 'none',
        '> .general-schema-designer-icons': {
          position: 'absolute',
          right: '2px',
          top: '2px',
          lineHeight: '16px',
          pointerEvents: 'all',
          '.ant-space-item': {
            backgroundColor: 'var(--colorSettings)',
            color: '#fff',
            lineHeight: '16px',
            width: '16px',
            paddingLeft: '1px',
          },
        },
      },
      '.itemCss': {
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        '&:not(:first-child)': {
          paddingTop: token.paddingContentVertical,
        },

        '&:not(:last-child)': {
          paddingBottom: token.paddingContentVertical,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        },
      },
    },
  };
});

export default useStyles;
