import { SchemaSettings } from '../../../application/schema-settings';
import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import {
  EditComponent,
  EditDescription,
  EditOperator,
  EditTitle,
  EditTitleField,
  EditTooltip,
  EditValidationRules,
} from './SchemaSettingOptions';

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
        const { getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const fieldSchema = useFieldSchema();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
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
