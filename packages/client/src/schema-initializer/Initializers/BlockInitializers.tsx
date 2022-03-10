import { gridRowColWrap } from './utils';

// 页面里添加区块
export const BlockInitializers = {
  title: '{{t("Add block")}}',
  wrap: gridRowColWrap,
  items: [
    {
      type: 'itemGroup',
      title: 'Data blocks',
      children: [
        {
          type: 'item',
          title: 'Table',
          component: 'TableBlockInitializer',
        },
        {
          type: 'item',
          title: 'Form',
          component: 'FormBlockInitializer',
        },
        {
          type: 'item',
          title: 'Calendar',
          component: 'CalendarBlockInitializer',
        },
        {
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
