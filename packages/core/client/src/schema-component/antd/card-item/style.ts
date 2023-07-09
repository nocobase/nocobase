import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-card-item', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      height: '100%',
      '.ant-card': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '.ant-card-body': {
          height: '1px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      },
      '.card': {
        marginBottom: token.marginLG,
      },
    },
  };
});

export default useStyles;
