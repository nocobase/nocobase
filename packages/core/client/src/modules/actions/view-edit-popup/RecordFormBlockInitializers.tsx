import { CompatibleSchemaInitializer } from '../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializer } from '../../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap } from '../../../schema-initializer/utils';

/**
 * @deprecated
 */
export const recordFormBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'RecordFormBlockInitializers',
  title: '{{ t("Add block") }}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      type: 'itemGroup',
      title: '{{ t("Data blocks") }}',
      name: 'dataBlocks',
      children: [
        {
          name: 'form',
          title: '{{ t("Form") }}',
          Component: 'RecordFormBlockInitializer',
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

export const recordFormBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'blockInitializers:recordForm',
    title: '{{ t("Add block") }}',
    icon: 'PlusOutlined',
    wrap: gridRowColWrap,
    items: [
      {
        type: 'itemGroup',
        title: '{{ t("Data blocks") }}',
        name: 'dataBlocks',
        children: [
          {
            name: 'form',
            title: '{{ t("Form") }}',
            Component: 'RecordFormBlockInitializer',
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
  recordFormBlockInitializers_deprecated,
);
