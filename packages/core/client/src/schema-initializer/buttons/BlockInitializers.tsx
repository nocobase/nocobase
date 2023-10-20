import { gridRowColWrap } from '../utils';
import { InitializerGroup, SchemaInitializerV2 } from '../../application';

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

export const blockInitializers = new SchemaInitializerV2({
  name: 'BlockInitializers',
  'data-testid': 'add-block-button-in-page',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'data-blocks',
      title: '{{t("Data blocks")}}',
      // Component: InitializerGroup,
      type: 'itemGroup',
      children: [
        {
          name: 'table',
          title: '{{t("Table")}}',
          Component: 'TableBlockInitializer',
        },
        {
          name: 'form',
          title: '{{t("Form")}}',
          Component: 'FormBlockInitializer',
        },
        {
          name: 'details',
          title: '{{t("Details")}}',
          Component: 'DetailsBlockInitializer',
        },
        {
          name: 'List',
          title: '{{t("List")}}',
          Component: 'ListBlockInitializer',
        },
        {
          name: 'GridCard',
          title: '{{t("Grid Card")}}',
          Component: 'GridCardBlockInitializer',
        },
        {
          name: 'calendar',
          title: '{{t("Calendar")}}',
          Component: 'CalendarBlockInitializer',
        },
        {
          name: 'kanban',
          title: '{{t("Kanban")}}',
          Component: 'KanbanBlockInitializer',
        },
        {
          name: 'Gantt',
          title: '{{t("Gantt")}}',
          Component: 'GanttBlockInitializer',
        },
      ],
    },
    {
      name: 'filter-blocks',
      Component: InitializerGroup,
      title: '{{t("Filter blocks")}}',
      children: [
        {
          name: 'filterForm',
          title: '{{t("Form")}}',
          Component: 'FilterFormBlockInitializer',
        },
        {
          name: 'filterCollapse',
          title: '{{t("Collapse")}}',
          Component: 'FilterCollapseBlockInitializer',
        },
      ],
    },
    {
      name: 'media',
      Component: InitializerGroup,
      title: '{{t("Other blocks")}}',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
        {
          name: 'auditLogs',
          title: '{{t("Audit logs")}}',
          Component: 'AuditLogsBlockInitializer',
        },
      ],
    },
  ],
});
