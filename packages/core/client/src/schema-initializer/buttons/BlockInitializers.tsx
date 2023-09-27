import { gridRowColWrap } from '../utils';

// 页面里添加区块
export const BlockInitializers = {
  'data-testid': 'add-block-button-in-page',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      key: 'dataBlocks',
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      children: [
        {
          key: 'table',
          type: 'item',
          title: '{{t("Table")}}',
          component: 'TableBlockInitializer',
        },
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
          key: 'List',
          type: 'item',
          title: '{{t("List")}}',
          component: 'ListBlockInitializer',
        },
        {
          key: 'GridCard',
          type: 'item',
          title: '{{t("Grid Card")}}',
          component: 'GridCardBlockInitializer',
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
      key: 'filterBlocks',
      type: 'itemGroup',
      title: '{{t("Filter blocks")}}',
      children: [
        {
          key: 'filterForm',
          type: 'item',
          title: '{{t("Form")}}',
          component: 'FilterFormBlockInitializer',
        },
        {
          key: 'filterCollapse',
          type: 'item',
          title: '{{t("Collapse")}}',
          component: 'FilterCollapseBlockInitializer',
        },
      ],
    },
    {
      key: 'media',
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      children: [
        {
          key: 'markdown',
          type: 'item',
          title: '{{t("Markdown")}}',
          component: 'MarkdownBlockInitializer',
        },
        {
          key: 'auditLogs',
          type: 'item',
          title: '{{t("Audit logs")}}',
          component: 'AuditLogsBlockInitializer',
        },
      ],
    },
  ],
};
