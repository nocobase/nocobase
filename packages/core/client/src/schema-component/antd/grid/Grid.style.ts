import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-grid', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.ColDivider': {
        flexShrink: 0,
        width: token.marginBlock,

        '.DraggableNode': {
          '&::before': {
            content: "' '",
            width: '100%',
            height: '100%',
            position: 'absolute',
            cursor: 'col-resize',
          },
          '&:hover': {
            '&::before': { background: 'var(--colorBgSettingsHover) !important' },
          },
          width: token.marginBlock,
          height: '100%',
          position: 'absolute',
          cursor: 'col-resize',
        },
      },

      '.RowDivider': {
        height: token.marginBlock,
        width: '100%',
        position: 'absolute',
        marginTop: `calc(-1 * ${token.marginBlock}px)`,
      },

      '.CardRow': {
        display: 'flex',
        position: 'relative',
      },

      '.showDivider': {
        margin: `0 calc(-1 * ${token.marginBlock}px)`,
      },
    },
  };
});

export default useStyles;
