import { SchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { generateNTemplate } from '../../../locale';

export const mBlockInitializers = new SchemaInitializer({
  name: 'MBlockInitializers',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'data-blocks',
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      children: [
        {
          name: 'grid-card',
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
          name: 'map-block',
          title: generateNTemplate('Map'),
          Component: 'MapBlockInitializer',
        },
      ],
    },
    {
      mame: 'other-blocks',
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
