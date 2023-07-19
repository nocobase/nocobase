import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-association-filter-item', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '&.SortableItem': {
        position: 'relative',
        '&:hover': { '> .general-schema-designer': { display: 'block' } },
        '&.nb-form-item:hover': {
          '> .general-schema-designer': {
            background: 'var(--colorBgSettingsHover) !important',
            border: '0 !important',
            top: `-${token.sizeXXS}px !important`,
            bottom: `-${token.sizeXXS}px !important`,
            left: `-${token.sizeXXS}px !important`,
            right: `-${token.sizeXXS}px !important`,
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
          border: '2px solid var(--colorBorderSettingsHover)',
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
      },

      '.Panel': {
        '& .ant-collapse-content-box': {
          padding: `0 ${token.paddingXS}px !important`,
          maxHeight: '400px',
          overflow: 'auto',
        },
        '& .ant-collapse-header.ant-collapse-header.ant-collapse-header': {
          background: token.colorFillQuaternary,
          borderRadius: 0,
        },
      },

      '.headerRow': {
        alignItems: 'center',
        width: '100%',
        minWidth: '0',
        height: '22px',
        flexWrap: 'nowrap',
      },

      '.headerCol': {
        flex: '1 1 auto',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',

        '.search': {
          outline: 'none',
          background: token.colorFillQuaternary,
          width: '100%',
          border: 'none',
          height: '20px',
          padding: '4px',
          '&::placeholder': { color: token.colorTextPlaceholder },
        },
      },

      '.CloseOutlined': {
        color: `${token.colorIcon} !important`,
        fontSize: '11px',
      },

      '.SearchOutlined': {
        color: `${token.colorIcon} !important`,
      },

      '.Tree': {
        padding: `${token.padding}px 0`,

        '.ant-tree-node-content-wrapper': {
          overflowX: 'hidden',
        },
      },
    },
  };
});

export default useStyles;
