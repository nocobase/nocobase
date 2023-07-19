import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-grid', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.ColDivider': {
        flexShrink: 0,
        width: token.marginLG,

        '.DraggableNode': {
          '&::before': {
            content: "' '",
            width: '100%',
            height: '100%',
            position: 'absolute',
            cursor: 'col-resize',
          },
          '&:hover': {
            '&::before': { background: 'rgba(241, 139, 98, 0.06) !important' },
          },
          width: token.marginLG,
          height: '100%',
          position: 'absolute',
          cursor: 'col-resize',
        },
      },

      '.RowDivider': {
        height: token.marginLG,
        width: '100%',
        position: 'absolute',
        marginTop: `calc(-1 * ${token.marginLG}px)`,
      },

      '.CardRow': {
        display: 'flex',
        position: 'relative',
      },

      '.showDivider': {
        margin: `0 calc(-1 * ${token.marginLG}px)`,
      },
    },
  };
});

export default useStyles;
