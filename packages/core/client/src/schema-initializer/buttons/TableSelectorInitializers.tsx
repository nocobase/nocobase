import { useCollection } from '../..';
import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap } from '../utils';

export const tableSelectorInitializers = new SchemaInitializer({
  name: 'TableSelectorInitializers',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Selector")}}',
      name: 'selector',
      children: [
        {
          name: 'title',
          title: 'Table',
          Component: 'TableSelectorInitializer',
        },
      ],
    },
    {
      type: 'itemGroup',
      title: '{{t("Filter blocks")}}',
      name: 'filterBlocks',
      useChildren() {
        const { name } = useCollection();
        return [
          {
            name: 'filterFormBlockInTableSelector',
            title: '{{t("Form")}}',
            Component: 'FilterFormBlockInitializer',
            collectionName: name,
          },
          {
            name: 'filterCollapseBlockInTableSelector',
            title: '{{t("Collapse")}}',
            Component: 'FilterCollapseBlockInitializer',
            collectionName: name,
          },
        ];
      },
    },
    {
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      name: 'otherBlocks',
      children: [
        {
          title: '{{t("Add text")}}',
          Component: 'BlockItemInitializer',
          name: 'addText',
          schema: {
            type: 'void',
            'x-editable': false,
            'x-decorator': 'BlockItem',
            'x-designer': 'Markdown.Void.Designer',
            'x-component': 'Markdown.Void',
            'x-component-props': {
              content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
            },
          },
        },
      ],
    },
  ],
});
