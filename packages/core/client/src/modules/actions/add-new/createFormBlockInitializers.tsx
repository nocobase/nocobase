import { CompatibleSchemaInitializer } from '../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializer } from '../../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap } from '../../../schema-initializer/utils';

/**
 * @deprecated
 */
export const createFormBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CreateFormBlockInitializers',
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
          Component: 'CreateFormBlockInitializer',
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

export const createFormBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'blockInitializers:createForm',
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
            Component: 'CreateFormBlockInitializer',
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
  createFormBlockInitializers_deprecated,
);
