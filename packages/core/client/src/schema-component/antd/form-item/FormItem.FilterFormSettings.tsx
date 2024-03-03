import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../application/schema-settings';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { useRecord } from '../../../record-provider';
import { VariableInput, getShouldChange } from '../../../schema-settings';
import { useLocalVariables, useVariables } from '../../../variables';
import { useDesignable } from '../../hooks';
import { removeNullCondition } from '../filter';
import { DynamicComponentProps } from '../filter/DynamicComponent';
import { useIsFormReadPretty, useIsSelectFieldMode } from './FormItem.Settings';
import {
  EditComponent,
  EditDescription,
  EditOperator,
  EditTitle,
  EditTitleField,
  EditTooltip,
  EditValidationRules,
} from './SchemaSettingOptions';
import { SchemaSettingsDataScope } from '../../../schema-settings/SchemaSettingsDataScope';

/**
 * @deprecated
 */
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
      name: 'setDataScope',
      Component: SchemaSettingsDataScope,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFormReadPretty = useIsFormReadPretty();
        return isSelectFieldMode && !isFormReadPretty;
      },
      useComponentProps() {
        const { getCollectionJoinField, getAllCollectionsInheritChain } = useCollectionManager_deprecated();
        const { getField } = useCollection_deprecated();
        const { form } = useFormBlockContext();
        const record = useRecord();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const variables = useVariables();
        const localVariables = useLocalVariables();
        const { dn } = useDesignable();
        return {
          collectionName: collectionField?.target,
          defaultFilter: fieldSchema?.['x-component-props']?.service?.params?.filter || {},
          form,
          dynamicComponent: (props: DynamicComponentProps) => {
            return (
              <VariableInput
                {...props}
                form={form}
                collectionField={props.collectionField}
                record={record}
                shouldChange={getShouldChange({
                  collectionField: props.collectionField,
                  variables,
                  localVariables,
                  getAllCollectionsInheritChain,
                })}
              />
            );
          },
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            _.set(field.componentProps, 'service.params.filter', filter);
            fieldSchema['x-component-props'] = field.componentProps;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-component-props': field.componentProps,
              },
            });
          },
        };
      },
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
        const { getCollectionJoinField } = useCollectionManager_deprecated();
        const { getField } = useCollection_deprecated();
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
