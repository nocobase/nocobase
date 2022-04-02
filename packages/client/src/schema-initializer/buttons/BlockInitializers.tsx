import { gridRowColWrap } from '../utils';

// 页面里添加区块
export const BlockInitializers = {
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      key: 'dataBlocks',
      type: 'itemGroup',
      title: 'Data blocks',
      children: [
        {
          key: 'table',
          type: 'item',
          title: 'Table',
          component: 'TableBlockInitializer',
        },
        {
          key: 'form',
          type: 'item',
          title: 'Form',
          component: 'FormBlockInitializer',
        },
        {
          key: 'calendar',
          type: 'item',
          title: 'Calendar',
          component: 'CalendarBlockInitializer',
        },
        {
          key: 'kanban',
          type: 'item',
          title: 'Kanban',
          component: 'KanbanBlockInitializer',
        },
      ],
    },
    {
      type: 'itemGroup',
      title: 'Media',
      children: [
        {
          type: 'item',
          title: 'Markdown',
          component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
};
