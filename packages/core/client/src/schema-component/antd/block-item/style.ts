import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-card-item', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      marginBottom: token.marginLG,
    },
  };
});

export default useStyles;
