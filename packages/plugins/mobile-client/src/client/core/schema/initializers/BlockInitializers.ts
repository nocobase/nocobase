import { gridItemWrap } from '../helpers';

// 页面里添加区块
export const MBlockInitializers = {
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridItemWrap,
  items: [
    {
      key: 'dataBlocks',
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      children: [
        {
          key: 'form',
          type: 'item',
          title: '{{t("Form")}}',
          component: 'FormBlockInitializer',
        },
        {
          key: 'details',
          type: 'item',
          title: '{{t("Details")}}',
          component: 'DetailsBlockInitializer',
        },
        {
          key: 'calendar',
          type: 'item',
          title: '{{t("Calendar")}}',
          component: 'CalendarBlockInitializer',
        },
        {
          key: 'kanban',
          type: 'item',
          title: '{{t("Kanban")}}',
          component: 'KanbanBlockInitializer',
        },
        {
          key: 'Gantt',
          type: 'item',
          title: '{{t("Gantt")}}',
          component: 'GanttBlockInitializer',
        },

      ],
    },
    {
      key: 'otherBlocks',
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      children: [
        {
          key: 'menu',
          type: 'item',
          title: '{{t("Menu")}}',
          component: 'MMenuBlockInitializer',
          sort: 100,
        },
      ],
    },
  ],
};
