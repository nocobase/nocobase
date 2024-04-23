import { genStyleHook } from '../__builtins__';

export const useStyles = genStyleHook('nb-action-drawer', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      overflow: 'hidden',
      '&.reset': {
        '&.nb-action-popup': {
          '.ant-drawer-header': { display: 'none' },
          '.ant-drawer-body': { paddingTop: token.paddingContentVerticalLG, backgroundColor: token.colorBgLayout },
        },
        '&.nb-record-picker-selector': {
          '.ant-drawer-wrapper-body': {
            backgroundColor: token.colorBgLayout,
          },
          '.nb-block-item': {
            marginBottom: token.marginBlock,
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
        borderLeft: `1px solid rgba(255, 255, 255, 0.1)`,
      },

      '.ant-tabs-content-holder': {
        padding: `${token.paddingPopupVertical}px ${token.paddingPopupHorizontal}px`,
        margin: `-${token.size}px -${token.paddingLG}px`,
      },
    },
  };
});
