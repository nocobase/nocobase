import { SchemaInitializer } from '@nocobase/client';
import { BulkEditSubmitActionInitializer } from './BulkEditSubmitActionInitializer';
export const BulkEditFormActionInitializers = new SchemaInitializer({
  name: 'BulkEditFormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
      children: [
        {
          name: 'submit',
          title: '{{t("Submit")}}',
          Component: BulkEditSubmitActionInitializer,
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
  ],
});
