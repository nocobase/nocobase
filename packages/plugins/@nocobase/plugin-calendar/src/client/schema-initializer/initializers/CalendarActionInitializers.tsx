import { useCollection } from '@nocobase/client';
import { generateNTemplate } from '../../../locale';

// 日历的操作配置
export const CalendarActionInitializers = {
  title: generateNTemplate('Configure actions'),
  icon: 'SettingOutlined',
  style: { marginLeft: 8 },
  items: [
    {
      type: 'itemGroup',
      title: generateNTemplate('Enable actions'),
      children: [
        {
          type: 'item',
          title: generateNTemplate('Today'),
          component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Today'),
            'x-component': 'CalendarV2.Today',
            'x-action': `calendar:today`,
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Turn pages'),
          component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Turn pages'),
            'x-component': 'CalendarV2.Nav',
            'x-action': `calendar:nav`,
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Title'),
          component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Title'),
            'x-component': 'CalendarV2.Title',
            'x-action': `calendar:title`,
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Select view'),
          component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Select view'),
            'x-component': 'CalendarV2.ViewSelect',
            'x-action': `calendar:viewSelect`,
            'x-align': 'right',
            'x-designer': 'Action.Designer',
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Filter'),
          component: 'FilterActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Add new'),
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
