export const refreshOnCompleteAction = {
  title: '执行后刷新数据',
  uiSchema: {
    enable: {
      type: 'boolean',
      title: 'Enable refresh',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  defaultParams(ctx) {
    return {
      enable: true,
    };
  },
  async handler(ctx, params) {
    if (params.enable) {
      await ctx.extra.currentResource.refresh();
      ctx.globals.message.success('Data refreshed successfully.');
    }
  },
}
