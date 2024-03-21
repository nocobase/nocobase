import { CompatibleSchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { NAMESPACE } from '../../locale';

/**
 * @deprecated
 */
export const snapshotBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'SnapshotBlockInitializers',
  wrap: gridRowColWrap,
  title: `{{t("Add block", { ns: "${NAMESPACE}" })}}`,
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Current record blocks")}}',
      name: 'currentRecordBlocks',
      children: [
        {
          name: 'details',
          title: '{{t("Details")}}',
          Component: 'SnapshotBlockInitializersDetailItem',
          actionInitializers: 'details:configureActions',
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

export const snapshotBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:snapshot:addBlock',
    wrap: gridRowColWrap,
    title: `{{t("Add block", { ns: "${NAMESPACE}" })}}`,
    icon: 'PlusOutlined',
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Current record blocks")}}',
        name: 'currentRecordBlocks',
        children: [
          {
            name: 'details',
            title: '{{t("Details")}}',
            Component: 'SnapshotBlockInitializersDetailItem',
            actionInitializers: 'details:configureActions',
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
  snapshotBlockInitializers_deprecated,
);
