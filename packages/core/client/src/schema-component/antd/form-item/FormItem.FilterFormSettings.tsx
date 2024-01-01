import { SchemaSettings } from '../../../application/schema-settings';
import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  EditComponent,
  EditDescription,
  EditOperator,
  EditTitle,
  EditTitleField,
  EditTooltip,
  EditValidationRules,
} from './SchemaSettingOptions';
import { useCollectionManagerV2, useCollectionV2 } from '../../../application';

export const filterFormItemSettings = new SchemaSettings({
  name: 'FilterFormItemSettings',
  items: [
    {
      name: 'editFieldTitle',
      Component: EditTitle,
    },
    {
      name: 'editDescription',
      Component: EditDescription,
    },
    {
      name: 'editTooltip',
      Component: EditTooltip,
    },
    {
      name: 'validationRules',
      Component: EditValidationRules,
    },
    {
      name: 'fieldMode',
      Component: EditComponent,
    },
    {
      name: 'operator',
      Component: EditOperator,
    },
    {
      name: 'titleField',
      Component: EditTitleField,
    },
    {
      name: 'divider',
      type: 'divider',
      useVisible() {
        const cm = useCollectionManagerV2();
        const collection = useCollectionV2();
        const fieldSchema = useFieldSchema();
        const collectionField =
          collection.getField(fieldSchema['name']) || cm.getCollectionField(fieldSchema['x-collection-field']);
        return !!collectionField;
      },
    },
    {
      name: 'remove',
      type: 'remove',
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          confirm: {
            title: t('Delete field'),
          },
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
