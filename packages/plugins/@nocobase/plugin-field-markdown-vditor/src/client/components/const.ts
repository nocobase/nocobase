export const cdn =
  process.env.NODE_ENV !== 'production'
    ? '/api/vditor'
    : '/static/plugins/@nocobase/plugin-field-markdown-vditor/dist/client/vditor';
