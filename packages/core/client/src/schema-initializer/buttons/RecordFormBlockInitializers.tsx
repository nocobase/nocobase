import { gridRowColWrap } from '../utils';
import { SchemaInitializer } from '../../application';

export const recordFormBlockInitializers = new SchemaInitializer({
  name: 'RecordFormBlockInitializers',
  'data-testid': 'add-block-button-in-record-form-block',
  title: '{{ t("Add block") }}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      type: 'itemGroup',
      title: '{{ t("Data blocks") }}',
      name: 'data-blocks',
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
