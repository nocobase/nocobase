import { genStyleHook } from '../__builtins__';

export const useStyles = genStyleHook('nb-action-drawer', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      overflow: 'hidden',
      '&.reset': {
        '&.nb-action-popup': {
          '.ant-drawer-header': { display: 'none' },
          '.ant-drawer-body': { paddingTop: token.paddingContentVerticalLG, backgroundColor: 'var(--colorBgDrawer)' },
        },
        '&.nb-record-picker-selector': {
          '.ant-drawer-wrapper-body': {
            backgroundColor: 'var(--colorBgDrawer)',
          },
          '.nb-block-item': {
            marginBottom: token.marginLG,
            '.general-schema-designer': {
              top: -token.sizeXS,
              bottom: -token.sizeXS,
              left: -token.sizeXS,
              right: -token.sizeXS,
            },
          },
        },
      },

      '.footer': {
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
        '.ant-btn': { marginRight: token.marginXS },
      },

      '.ant-drawer-content-wrapper': {
        borderLeft: `1px solid ${token.colorBorder}`,
      },
    },
  };
});
