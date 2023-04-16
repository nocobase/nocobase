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
          key: 'list',
          type: 'item',
          title: '{{t("List")}}',
          component: 'MListBlockInitializer',
          sort: 100,
        },
        {
          key: 'list',
          type: 'item',
          title: '{{t("List")}}',
          component: 'MListBlockInitializer',
          sort: 100,
        },
        {
          key: 'details',
          type: 'item',
          title: '{{t("Details")}}',
          component: 'MDetailsBlockInitializer',
          sort: 200,
        },
        {
          key: 'form',
          type: 'item',
          title: '{{t("Form")}}',
          component: 'MFormBlockInitializer',
          sort: 300,
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
