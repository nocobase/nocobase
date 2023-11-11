import { useCollection } from '../../';
import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';

// 日历的操作配置
export const calendarActionInitializers = new SchemaInitializer({
  name: 'CalendarActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  style: { marginLeft: 8 },
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
      children: [
        {
          name: 'today',
          title: '{{t("Today")}}',
          Component: 'ActionInitializer',
          schema: {
            title: '{{t("Today")}}',
            'x-component': 'CalendarV2.Today',
            'x-action': `calendar:today`,
            'x-align': 'left',
          },
        },
        {
          name: 'turnPages',
          title: '{{t("Turn pages")}}',
          Component: 'ActionInitializer',
          schema: {
            title: '{{t("Turn pages")}}',
            'x-component': 'CalendarV2.Nav',
            'x-action': `calendar:nav`,
            'x-align': 'left',
          },
        },
        {
          name: 'title',
          title: '{{t("Title")}}',
          Component: 'ActionInitializer',
          schema: {
            title: '{{t("Title")}}',
            'x-component': 'CalendarV2.Title',
            'x-action': `calendar:title`,
            'x-align': 'left',
          },
        },
        {
          name: 'selectView',
          title: '{{t("Select view")}}',
          Component: 'ActionInitializer',
          schema: {
            title: '{{t("Select view")}}',
            'x-component': 'CalendarV2.ViewSelect',
            'x-action': `calendar:viewSelect`,
            'x-align': 'right',
            'x-designer': 'Action.Designer',
          },
        },
        {
          name: 'filter',
          title: "{{t('Filter')}}",
          Component: 'FilterActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
        {
          name: 'addNew',
          title: '{{ t("Add new") }}',
          Component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
  ],
});
