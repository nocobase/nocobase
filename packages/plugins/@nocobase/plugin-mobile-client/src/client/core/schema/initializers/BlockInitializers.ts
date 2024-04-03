import { CompatibleSchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { generateNTemplate } from '../../../locale';

const mBlockInitializersOptions = {
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
        {
          name: 'charts',
          title: '{{t("Charts")}}',
          Component: 'ChartV2BlockInitializer',
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
};

/**
 * @deprecated
 * use `mBlockInitializers` instead
 */
export const mBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  ...mBlockInitializersOptions,
  name: 'MBlockInitializers',
});

export const mBlockInitializers = new CompatibleSchemaInitializer(
  mBlockInitializersOptions,
  mBlockInitializers_deprecated,
);
