import { genStyleHook } from '@nocobase/client';

export default genStyleHook('nb-field-markdown-vditor', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.vditor .vditor-toolbar': { paddingLeft: ' 16px !important' },
      '.vditor .vditor-content .vditor-ir .vditor-reset': { paddingLeft: ' 16px !important' },
    },
  };
});
