export const secondaryConfirmationAction = {
  title: '二次确认',
  uiSchema: {
    enable: {
      type: 'boolean',
      title: 'Enable secondary confirmation',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    title: {
      type: 'string',
      title: 'Title',
      default: 'Delete record',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    content: {
      type: 'string',
      title: 'Content',
      default: 'Are you sure you want to delete it?',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
  defaultParams(ctx) {
    return {
      enable: true,
      title: 'Delete record',
      content: 'Are you sure you want to delete it?',
    };
  },
  async handler(ctx, params) {
    if (params.enable) {
      const confirmed = await ctx.globals.modal.confirm({
        title: params.title,
        content: params.content,
      });

      if (!confirmed) {
        ctx.exit();
      }
    }
  },
};
