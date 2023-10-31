import { gridRowColWrap } from '../utils';
import { SchemaInitializer } from '../../application/schema-initializer';

export const createFormBlockInitializers = new SchemaInitializer({
  name: 'CreateFormBlockInitializers',
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
          Component: 'CreateFormBlockInitializer',
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
