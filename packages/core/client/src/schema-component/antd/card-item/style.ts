import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-card-item', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      marginBottom: token.marginBlock,
    },
  };
});

export default useStyles;
