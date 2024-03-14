import { CompatibleSchemaInitializer, useCollection_deprecated } from '@nocobase/client';
import { generateNTemplate } from '../../../locale';

/**
 * @deprecated
 * 日历的操作配置
 */
export const CalendarActionInitializers_deprecated = new CompatibleSchemaInitializer({
  title: generateNTemplate('Configure actions'),
  icon: 'SettingOutlined',
  name: 'CalendarActionInitializers',
  style: { marginLeft: 8 },
  items: [
    {
      type: 'itemGroup',
      name: 'enableActions',
      title: generateNTemplate('Enable actions'),
      children: [
        {
          name: 'today',
          title: generateNTemplate('Today'),
          Component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Today'),
            'x-component': 'CalendarV2.Today',
            'x-action': `calendar:today`,
            'x-align': 'left',
          },
        },
        {
          name: 'turnPages',
          title: generateNTemplate('Turn pages'),
          Component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Turn pages'),
            'x-component': 'CalendarV2.Nav',
            'x-action': `calendar:nav`,
            'x-align': 'left',
          },
        },
        {
          name: 'title',
          title: generateNTemplate('Title'),
          Component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Title'),
            'x-component': 'CalendarV2.Title',
            'x-action': `calendar:title`,
            'x-align': 'left',
          },
        },
        {
          name: 'selectView',
          title: generateNTemplate('Select view'),
          Component: 'ActionInitializer',
          schema: {
            title: generateNTemplate('Select view'),
            'x-component': 'CalendarV2.ViewSelect',
            'x-action': `calendar:viewSelect`,
            'x-align': 'right',
            'x-designer': 'Action.Designer',
          },
        },
        {
          name: 'filter',
          title: generateNTemplate('Filter'),
          Component: 'FilterActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
        {
          name: 'addNew',
          title: generateNTemplate('Add new'),
          Component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
  ],
});

export const calendarActionInitializers = new CompatibleSchemaInitializer(
  {
    title: generateNTemplate('Configure actions'),
    icon: 'SettingOutlined',
    name: 'calendar:configureActions',
    style: { marginLeft: 8 },
    items: [
      {
        type: 'itemGroup',
        name: 'enableActions',
        title: generateNTemplate('Enable actions'),
        children: [
          {
            name: 'today',
            title: generateNTemplate('Today'),
            Component: 'ActionInitializer',
            schema: {
              title: generateNTemplate('Today'),
              'x-component': 'CalendarV2.Today',
              'x-action': `calendar:today`,
              'x-align': 'left',
            },
          },
          {
            name: 'turnPages',
            title: generateNTemplate('Turn pages'),
            Component: 'ActionInitializer',
            schema: {
              title: generateNTemplate('Turn pages'),
              'x-component': 'CalendarV2.Nav',
              'x-action': `calendar:nav`,
              'x-align': 'left',
            },
          },
          {
            name: 'title',
            title: generateNTemplate('Title'),
            Component: 'ActionInitializer',
            schema: {
              title: generateNTemplate('Title'),
              'x-component': 'CalendarV2.Title',
              'x-action': `calendar:title`,
              'x-align': 'left',
            },
          },
          {
            name: 'selectView',
            title: generateNTemplate('Select view'),
            Component: 'ActionInitializer',
            schema: {
              title: generateNTemplate('Select view'),
              'x-component': 'CalendarV2.ViewSelect',
              'x-action': `calendar:viewSelect`,
              'x-align': 'right',
              'x-designer': 'Action.Designer',
            },
          },
          {
            name: 'filter',
            title: generateNTemplate('Filter'),
            Component: 'FilterActionInitializer',
            schema: {
              'x-align': 'right',
            },
          },
          {
            name: 'addNew',
            title: generateNTemplate('Add new'),
            Component: 'CreateActionInitializer',
            schema: {
              'x-align': 'right',
              'x-decorator': 'ACLActionProvider',
              'x-acl-action-props': {
                skipScopeCheck: true,
              },
            },
            useVisible() {
              const collection = useCollection_deprecated();
              return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
            },
          },
        ],
      },
    ],
  },
  CalendarActionInitializers_deprecated,
);
