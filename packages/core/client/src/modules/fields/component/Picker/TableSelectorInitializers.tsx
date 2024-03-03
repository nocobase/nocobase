import { useCollection_deprecated } from '../../../..';
import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap } from '../../../../schema-initializer/utils';

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
        const { name, dataSource } = useCollection_deprecated();
        return [
          {
            name: 'filterFormBlockInTableSelector',
            title: '{{t("Form")}}',
            Component: 'FilterFormBlockInitializer',
            componentProps: {
              filterMenuItemChildren() {
                return false;
              },
              onlyCurrentDataSource: true,
            },
            collectionName: name,
            dataSource,
          },
          {
            name: 'filterCollapseBlockInTableSelector',
            title: '{{t("Collapse")}}',
            Component: 'FilterCollapseBlockInitializer',
            componentProps: {
              filterMenuItemChildren() {
                return false;
              },
              onlyCurrentDataSource: true,
            },
            collectionName: name,
            dataSource,
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
            // 'x-designer': 'Markdown.Void.Designer',
            'x-toolbar': 'BlockSchemaToolbar',
            'x-settings': 'blockSettings:markdown',
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
