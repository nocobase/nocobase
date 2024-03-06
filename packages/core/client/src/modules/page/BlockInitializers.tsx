import { CompatibleSchemaInitializer } from '../../application/schema-initializer/CompatibleSchemaInitializer';
import { gridRowColWrap } from '../../schema-initializer/utils';

/**
 * @deprecated
 */
export const blockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'BlockInitializers',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'dataBlocks',
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
          name: 'list',
          title: '{{t("List")}}',
          Component: 'ListBlockInitializer',
        },
        {
          name: 'gridCard',
          title: '{{t("Grid Card")}}',
          Component: 'GridCardBlockInitializer',
        },
      ],
    },
    {
      name: 'filterBlocks',
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
      name: 'otherBlocks',
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

export const blockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'page:addBlock',
    title: '{{t("Add block")}}',
    icon: 'PlusOutlined',
    wrap: gridRowColWrap,
    items: [
      {
        name: 'dataBlocks',
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
            name: 'list',
            title: '{{t("List")}}',
            Component: 'ListBlockInitializer',
          },
          {
            name: 'gridCard',
            title: '{{t("Grid Card")}}',
            Component: 'GridCardBlockInitializer',
          },
        ],
      },
      {
        name: 'filterBlocks',
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
        name: 'otherBlocks',
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
  },
  blockInitializers_deprecated,
);
