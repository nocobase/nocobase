import { genStyleHook } from './../__builtins__';

export const useStyles = genStyleHook('nb-markdown', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      lineHeight: 1.612,
      '& > *:last-child': { marginBottom: '0' },
      '.ant-description-textarea, .ant-description-input': { lineHeight: 1.612 },
      '.field-interface-datetime': { minWidth: '100px' },
    },
  };
});
