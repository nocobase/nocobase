import { genStyleHook } from './../__builtins__';

export const useStyles = genStyleHook('nb-page', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'relative',
      zIndex: 20,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      '&:hover': { '> .general-schema-designer': { display: 'block' } },
      '.ant-page-header': { zIndex: 1, position: 'relative' },
      '> .general-schema-designer': {
        position: 'absolute',
        zIndex: 999,
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'none',
        border: '0',
        pointerEvents: 'none',
        '> .general-schema-designer-icons': {
          zIndex: 9999,
          position: 'absolute',
          right: '2px',
          top: '2px',
          lineHeight: '16px',
          pointerEvents: 'all',
          '.ant-space-item': {
            backgroundColor: '#f18b62',
            color: '#fff',
            lineHeight: '16px',
            width: '16px',
            paddingLeft: '1px',
          },
        },
      },

      '.pageHeaderCss': {
        backgroundColor: token.colorBgContainer,
        '&.ant-page-header-has-footer': {
          paddingTop: '12px',
          paddingBottom: '0',
          '.ant-page-header-heading-left': {},
          '.ant-page-header-footer': { marginTop: '0' },
        },
        '.ant-tabs-nav': { marginBottom: '0' },
      },

      '.height0': {
        fontSize: 0,
        height: 0,
      },

      '.addTabBtn': {
        borderColor: 'rgb(241, 139, 98) !important',
        color: 'rgb(241, 139, 98) !important',
      },

      '.designerCss': {
        position: 'relative',
        '&:hover': { '> .general-schema-designer': { display: 'block' } },
        '&.nb-action-link': {
          '> .general-schema-designer': {
            top: 'var(--nb-designer-offset)',
            bottom: 'var(--nb-designer-offset)',
            right: 'var(--nb-designer-offset)',
            left: 'var(--nb-designer-offset)',
          },
        },
        '> .general-schema-designer': {
          position: 'absolute',
          zIndex: 999,
          top: '0',
          bottom: '0',
          left: '0',
          right: '0',
          display: 'none',
          background: 'rgba(241, 139, 98, 0.06)',
          border: '0',
          pointerEvents: 'none',
          '> .general-schema-designer-icons': {
            position: 'absolute',
            right: '2px',
            top: '2px',
            lineHeight: '16px',
            pointerEvents: 'all',
            '.ant-space-item': {
              backgroundColor: '#f18b62',
              color: '#fff',
              lineHeight: '16px',
              width: '16px',
              paddingLeft: '1px',
            },
          },
        },
      },

      '.pageWithFixedBlockCss': {
        height: '100%',
        '> .nb-grid:not(:last-child)': {
          '> .nb-schema-initializer-button': { display: 'none' },
        },
      },

      '.nb-page-wrapper': {
        margin: token.marginLG,
        flex: 1,
      },
    },
  };
});
