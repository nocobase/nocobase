import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-variable-select', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'relative',
      '.ant-select.ant-cascader': {
        position: 'absolute',
        top: '-1px',
        right: '-1px',
        minWidth: 'auto',
        width: 'calc(100% + 2px)',
        height: 'calc(100% + 2px)',
        overflow: 'hidden',
        opacity: 0,
      },

      '.variable-btn': {
        fontStyle: 'italic',
        fontFamily: "'New York', 'Times New Roman', Times, serif",
      },

      '.Cascader-popupClassName': {
        '.ant-cascader-menu': {
          marginBottom: 0,
        },
      },
    },
  };
});

export default useStyles;
