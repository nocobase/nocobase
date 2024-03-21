import { CompatibleSchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { generateNTemplate } from '../../../locale';

/**
 * @deprecated
 */
export const mBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'MBlockInitializers',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'dataBlocks',
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      children: [
        {
          name: 'gridCard',
          type: 'item',
          title: '{{t("Grid Card")}}',
          Component: 'GridCardBlockInitializer',
        },
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
          name: 'calendar',
          title: '{{t("Calendar")}}',
          Component: 'CalendarBlockInitializer',
        },
        {
          name: 'mapBlock',
          title: generateNTemplate('Map'),
          Component: 'MapBlockInitializer',
        },
      ],
    },
    {
      name: 'otherBlocks',
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      children: [
        {
          name: 'menu',
          title: generateNTemplate('Menu'),
          Component: 'MMenuBlockInitializer',
        },
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
        {
          name: 'settings',
          title: generateNTemplate('Settings'),
          Component: 'MSettingsBlockInitializer',
        },
      ],
    },
  ],
});

export const mBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'mobilePage:addBlock',
    title: '{{t("Add block")}}',
    icon: 'PlusOutlined',
    wrap: gridRowColWrap,
    items: [
      {
        name: 'dataBlocks',
        type: 'itemGroup',
        title: '{{t("Data blocks")}}',
        children: [
          {
            name: 'gridCard',
            type: 'item',
            title: '{{t("Grid Card")}}',
            Component: 'GridCardBlockInitializer',
          },
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
            name: 'calendar',
            title: '{{t("Calendar")}}',
            Component: 'CalendarBlockInitializer',
          },
          {
            name: 'mapBlock',
            title: generateNTemplate('Map'),
            Component: 'MapBlockInitializer',
          },
        ],
      },
      {
        name: 'otherBlocks',
        type: 'itemGroup',
        title: '{{t("Other blocks")}}',
        children: [
          {
            name: 'menu',
            title: generateNTemplate('Menu'),
            Component: 'MMenuBlockInitializer',
          },
          {
            name: 'markdown',
            title: '{{t("Markdown")}}',
            Component: 'MarkdownBlockInitializer',
          },
          {
            name: 'settings',
            title: generateNTemplate('Settings'),
            Component: 'MSettingsBlockInitializer',
          },
        ],
      },
    ],
  },
  mBlockInitializers_deprecated,
);
