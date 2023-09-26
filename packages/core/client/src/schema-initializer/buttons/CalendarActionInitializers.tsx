import { useCollection } from '../../';

// 日历的操作配置
export const CalendarActionInitializers = {
  'data-testid': 'configure-actions-button-of-calendar-block',
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
          title: '{{t("Today")}}',
          component: 'ActionInitializer',
          schema: {
            title: '{{t("Today")}}',
            'x-component': 'CalendarV2.Today',
            'x-action': `calendar:today`,
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: '{{t("Turn pages")}}',
          component: 'ActionInitializer',
          schema: {
            title: '{{t("Turn pages")}}',
            'x-component': 'CalendarV2.Nav',
            'x-action': `calendar:nav`,
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: '{{t("Title")}}',
          component: 'ActionInitializer',
          schema: {
            title: '{{t("Title")}}',
            'x-component': 'CalendarV2.Title',
            'x-action': `calendar:title`,
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: '{{t("Select view")}}',
          component: 'ActionInitializer',
          schema: {
            title: '{{t("Select view")}}',
            'x-component': 'CalendarV2.ViewSelect',
            'x-action': `calendar:viewSelect`,
            'x-align': 'right',
            'x-designer': 'Action.Designer',
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
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
  ],
};
