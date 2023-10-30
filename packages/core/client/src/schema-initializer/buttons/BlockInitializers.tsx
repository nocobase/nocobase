import { SchemaInitializer } from '../../application';
import { gridRowColWrap } from '../utils';

export const blockInitializers = new SchemaInitializer({
  name: 'BlockInitializers',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'data-blocks',
      title: '{{t("Data blocks")}}',
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
      title: '{{t("Filter blocks")}}',
      type: 'itemGroup',
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
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
});
