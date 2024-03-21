import { CompatibleSchemaInitializer } from '../../../application/schema-initializer/CompatibleSchemaInitializer';
import { gridRowColWrap } from '../../../schema-initializer/utils';

/**
 * @deprecated
 */
export const customizeCreateFormBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CusomeizeCreateFormBlockInitializers',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      name: 'dataBlocks',
      children: [
        {
          name: 'form',
          title: '{{t("Form")}}',
          Component: 'FormBlockInitializer',
          isCusomeizeCreate: true,
        },
      ],
    },
    {
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      name: 'otherBlocks',
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

export const customizeCreateFormBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:addRecord:addBlock',
    wrap: gridRowColWrap,
    title: '{{t("Add block")}}',
    icon: 'PlusOutlined',
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Data blocks")}}',
        name: 'dataBlocks',
        children: [
          {
            name: 'form',
            title: '{{t("Form")}}',
            Component: 'FormBlockInitializer',
            isCusomeizeCreate: true,
          },
        ],
      },
      {
        type: 'itemGroup',
        title: '{{t("Other blocks")}}',
        name: 'otherBlocks',
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
  customizeCreateFormBlockInitializers_deprecated,
);
