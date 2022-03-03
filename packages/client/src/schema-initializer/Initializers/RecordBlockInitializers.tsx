import { gridRowColWrap } from './utils';

// 当前行记录所在面板的添加区块
export const RecordBlockInitializers = {
  wrap: gridRowColWrap,
  title: "{{t('Add block')}}",
  items: [
    {
      type: 'itemGroup',
      title: 'Data blocks',
      children: [
        {
          type: 'item',
          title: 'Details',
          component: 'RecordFormBlockInitializer',
        },
        {
          type: 'item',
          title: 'Form',
          component: 'RecordFormBlockInitializer',
        },
      ],
    },
    {
      type: 'itemGroup',
      title: '关系数据区块',
      children: [
        {
          type: 'item',
          title: '关系数据',
          component: 'RecordRelationBlockInitializer',
        },
      ],
    },
    {
      type: 'itemGroup',
      title: 'Media',
      children: [
        {
          type: 'item',
          title: 'Markdown',
          component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
};
