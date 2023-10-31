import { gridRowColWrap } from '../utils';
import { SchemaInitializer } from '../../application/schema-initializer';

export const createFormBulkEditBlockInitializers = new SchemaInitializer({
  name: 'CreateFormBulkEditBlockInitializers',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      name: 'data-blocks',
      children: [
        {
          name: 'form',
          title: '{{t("Form")}}',
          Component: 'CreateFormBulkEditBlockInitializer',
        },
      ],
    },
    {
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      name: 'other-blocks',
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
