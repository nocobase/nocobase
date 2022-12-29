export const TabActionInitializers = {
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Share")}}',
          component: 'ShareActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-action-settings': {},
          },
        },
      ],
    },
  ],
};
