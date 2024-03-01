export const sort = {
  options: () => ({
    type: 'sort',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  }),
  mock: () => {
    // 返回一个 undefined，由后端自动生成
    return;
  },
};
