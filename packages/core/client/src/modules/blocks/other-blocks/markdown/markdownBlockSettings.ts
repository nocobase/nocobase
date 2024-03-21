import { useField } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';

export const markdownBlockSettings = new SchemaSettings({
  name: 'blockSettings:markdown',
  items: [
    {
      name: 'EditMarkdown',
      type: 'item',
      useComponentProps() {
        const field = useField();
        const { t } = useTranslation();

        return {
          title: t('Edit markdown'),
          onClick: () => {
            field.editable = true;
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
