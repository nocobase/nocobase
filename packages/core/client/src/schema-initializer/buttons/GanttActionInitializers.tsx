// 甘特图的操作配置
export const GanttActionInitializers = {
    title: '{{t("Configure actions")}}',
    icon: 'SettingOutlined',
    style: { marginLeft: 8 },
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Enable actions")}}',
        children: [
          {
            type: 'item',
            title: '{{t("Show linkto")}}',
            component: 'ActionInitializer',
            schema: {
              title: '{{t("Select view")}}',
              'x-component': 'GanttV2.ViewSelect',
              'x-action': `gantt:showLinkto`,
              'x-align': 'right',
              'x-designer': 'Action.Designer',
            },
          },
          {
            type: 'item',
            title: "{{t('Time range')}}",
            component: 'FilterActionInitializer',
            schema: {
              'x-align': 'right',
            },
          },
          {
            type: 'item',
            title: "{{t('Filter')}}",
            component: 'FilterActionInitializer',
            schema: {
              'x-align': 'right',
            },
          },
          {
            type: 'item',
            title: '{{ t("Add new") }}',
            component: 'CreateActionInitializer',
            schema: {
              'x-align': 'right',
              'x-decorator': 'ACLActionProvider',
              'x-acl-action-props': {
                skipScopeCheck: true,
              },
            },
          },
        ],
      },
    ],
  };
  