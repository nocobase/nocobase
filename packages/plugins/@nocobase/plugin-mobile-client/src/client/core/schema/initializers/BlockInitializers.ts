import { gridRowColWrap } from '@nocobase/client';
import { generateNTemplate } from '../../../locale';

// 页面里添加区块
export const MBlockInitializers = {
  'data-testid': 'add-block-button-in-mobile-page',
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
          key: 'GridCard',
          type: 'item',
          title: '{{t("Grid Card")}}',
          component: 'GridCardBlockInitializer',
        },
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
          key: 'calendar',
          type: 'item',
          title: '{{t("Calendar")}}',
          component: 'CalendarBlockInitializer',
        },
        {
          key: 'mapBlock',
          type: 'item',
          title: generateNTemplate('Map'),
          component: 'MapBlockInitializer',
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
          title: generateNTemplate('Menu'),
          component: 'MMenuBlockInitializer',
          sort: 100,
        },
        {
          key: 'markdown',
          type: 'item',
          title: '{{t("Markdown")}}',
          component: 'MarkdownBlockInitializer',
        },
        {
          key: 'settings',
          type: 'item',
          title: generateNTemplate('Settings'),
          component: 'MSettingsBlockInitializer',
          sort: 100,
        },
      ],
    },
  ],
};
