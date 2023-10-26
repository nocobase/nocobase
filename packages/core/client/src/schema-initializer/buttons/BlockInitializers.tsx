import { gridRowColWrap } from '../utils';
import { SchemaInitializerGroup, SchemaInitializer } from '../../application';

export const blockInitializers = new SchemaInitializer({
  name: 'BlockInitializers',
  'data-testid': 'add-block-button-in-page',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'data-blocks',
      title: '{{t("Data blocks")}}',
      // Component: SchemaInitializerGroup,
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
      Component: SchemaInitializerGroup,
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
      Component: SchemaInitializerGroup,
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
