/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import _, { set } from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  SchemaSettingsSwitchItem,
} from '../../../schema-settings';
import { SchemaSettingsDataScope } from '../../../schema-settings/SchemaSettingsDataScope';
import { SchemaSettingsDateFormat } from '../../../schema-settings/SchemaSettingsDateFormat';
import { SchemaSettingsDefaultValue } from '../../../schema-settings/SchemaSettingsDefaultValue';
import { SchemaSettingsSortingRule } from '../../../schema-settings/SchemaSettingsSortingRule';
import { useIsAllowToSetDefaultValue } from '../../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { isPatternDisabled } from '../../../schema-settings/isPatternDisabled';
import { useCompile, useDesignable, useFieldModeOptions } from '../../hooks';
import { useAssociationFieldContext } from '../association-field/hooks';
import { removeNullCondition } from '../filter';
import { SchemaSettingsLinkageRules } from '../../../schema-settings';
import { useCollection } from '../../../data-source';
import { useSchemaToolbar } from '../../../application';

export const useLabelFields = (collectionName?: any) => {
  // 需要在组件顶层调用
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager_deprecated();
  if (!collectionName) {
    return [];
  }
  const targetFields = getCollectionFields(collectionName);
  return targetFields
    ?.filter?.((field) => field?.interface && !field?.target && field.type !== 'boolean')
    ?.map?.((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title || field.name),
      };
    });
};

export const useColorFields = (collectionName?: any) => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager_deprecated();
  if (!collectionName) {
    return [];
  }
  const targetFields = getCollectionFields(collectionName);
  return targetFields
    ?.filter?.((field) => field?.interface === 'color')
    ?.map?.((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title || field.name),
      };
    });
};
export const TableColumnDesigner = (props) => {
  const { uiSchema, fieldSchema, collectionField } = props;
  const { form } = useFormBlockContext();
  const { getInterface, getCollection } = useCollectionManager_deprecated();
  const field: any = useField();
  const { t } = useTranslation();
  const columnSchema = useFieldSchema();
  const { dn } = useDesignable();
  const fieldNames =
    fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
  const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);
  const colorFieldOptions = useColorFields(collectionField?.target ?? collectionField?.targetCollection);
  const interfaceCfg = getInterface(collectionField?.interface);
  const targetCollection = getCollection(collectionField?.target);
  const isFileField = isFileCollection(targetCollection);
  const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
  const { currentMode } = useAssociationFieldContext();
  const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue({ collectionField, fieldSchema });

  const isDateField = ['datetime', 'createdAt', 'updatedAt'].includes(collectionField?.interface);
  const isAssociationField = ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o', 'snapshot'].includes(
    collectionField?.interface,
  );
  const fieldModeOptions = useFieldModeOptions({ fieldSchema });
  const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';
  let readOnlyMode = 'editable';
  if (fieldSchema['x-disabled'] === true) {
    readOnlyMode = 'readonly';
  }
  if (fieldSchema['x-read-pretty'] === true) {
    readOnlyMode = 'read-pretty';
  }
  const isSelectFieldMode = isAssociationField && fieldMode === 'Select';

  const StyleSetting = () => {
    const { name } = useCollection();
    const { linkageRulesProps } = useSchemaToolbar();
    return <SchemaSettingsLinkageRules category={'style'} {...{ ...linkageRulesProps, collectionName: name }} />;
  };
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettingsModalItem
        title={t('Custom column title')}
        schema={
          {
            type: 'object',
            title: t('Custom column title'),
            properties: {
              title: {
                title: t('Column title'),
                default: columnSchema?.title,
                description: `${t('Original field title: ')}${collectionField?.uiSchema?.title || fieldSchema?.title}`,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        onSubmit={({ title }) => {
          if (title) {
            field.title = title;
            columnSchema.title = title;
            dn.emit('patch', {
              schema: {
                'x-uid': columnSchema['x-uid'],
                title: columnSchema.title,
              },
            });
          }
          dn.refresh();
        }}
      />
      {isSelectFieldMode && !field.readPretty && !uiSchema?.['x-read-pretty'] && isSubTableColumn && (
        <SchemaSettingsDataScope
          collectionName={collectionField?.target}
          defaultFilter={fieldSchema?.['x-component-props']?.service?.params?.filter || {}}
          form={form}
          onSubmit={({ filter }) => {
            filter = removeNullCondition(filter);
            set(field.componentProps, 'service.params.filter', filter);
            fieldSchema['x-component-props'] = field.componentProps;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.service = f.componentProps.service || { params: {} };
              f.componentProps.service.params.filter = filter;
            });
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-component-props': field.componentProps,
              },
            });
          }}
        />
      )}
      <SchemaSettingsModalItem
        title={t('Column width')}
        schema={
          {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 100,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        onSubmit={({ width }) => {
          const props = columnSchema['x-component-props'] || {};
          props['width'] = width;
          const schema: ISchema = {
            ['x-uid']: columnSchema['x-uid'],
          };
          schema['x-component-props'] = props;
          columnSchema['x-component-props'] = props;
          field.componentProps.width = width;
          dn.emit('patch', {
            schema,
          });
          dn.refresh();
        }}
      />
      <StyleSetting />
      {interfaceCfg && interfaceCfg.sortable === true && !currentMode && (
        <SchemaSettingsSwitchItem
          title={t('Sortable')}
          checked={field.componentProps.sorter}
          onChange={(v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {['linkTo', 'm2m', 'm2o', 'o2m', 'obo', 'oho', 'snapshot', 'createdBy', 'updatedBy'].includes(
        collectionField?.interface,
      ) &&
        !isFileField &&
        (readOnlyMode === 'read-pretty' || field.readPretty || field.readOnly) && (
          <SchemaSettingsSwitchItem
            title={t('Enable link')}
            checked={fieldSchema['x-component-props']?.enableLink !== false}
            onChange={(flag) => {
              fieldSchema['x-component-props'] = {
                ...fieldSchema?.['x-component-props'],
                enableLink: flag,
              };
              field.componentProps = {
                ...fieldSchema?.['x-component-props'],
                enableLink: flag,
              };
              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  'x-component-props': {
                    ...fieldSchema?.['x-component-props'],
                  },
                },
              });
              dn.refresh();
            }}
          />
        )}
      {['linkTo', 'm2m', 'm2o', 'o2m', 'obo', 'oho', 'snapshot'].includes(collectionField?.interface) && (
        <SchemaSettingsSelectItem
          title={t('Title field')}
          options={options}
          value={fieldNames?.['label']}
          onChange={(label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            _.set(fieldSchema, 'x-component-props.fieldNames', fieldNames);
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          }}
        />
      )}
      {isAssociationField && (
        <SchemaSettingsSelectItem
          key="field-mode"
          title={t('Field component')}
          options={
            readOnlyMode === 'read-pretty'
              ? [
                  { label: t('Title'), value: 'Select' },
                  isFileField && { label: t('File manager'), value: 'FileManager' },
                  { label: t('Tag'), value: 'Tag' },
                ].filter(Boolean)
              : fieldModeOptions
          }
          value={fieldMode}
          onChange={(mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}

      {['Tag'].includes(fieldMode) && (
        <SchemaSettingsSelectItem
          key="title-field"
          title={t('Tag color field')}
          options={colorFieldOptions}
          value={fieldSchema?.['x-component-props']?.tagColorField}
          onChange={(tagColorField) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };

            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['tagColorField'] = tagColorField;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps.tagColorField = tagColorField;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {isSubTableColumn && !field.readPretty && !uiSchema?.['x-read-pretty'] && (
        <SchemaSettingsSwitchItem
          key="required"
          title={t('Required')}
          checked={fieldSchema.required as boolean}
          onChange={(required) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['required'] = required;
            schema['required'] = required;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.required = required;
            });
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {isSubTableColumn &&
        !field?.readPretty &&
        collectionField?.interface !== 'o2m' &&
        !isPatternDisabled(fieldSchema) && (
          <SchemaSettingsSelectItem
            key="pattern"
            title={t('Pattern')}
            options={[
              { label: t('Editable'), value: 'editable' },
              { label: t('Readonly'), value: 'readonly' },
              { label: t('Easy-reading'), value: 'read-pretty' },
            ]}
            value={readOnlyMode}
            onChange={(v) => {
              const schema: ISchema = {
                ['x-uid']: fieldSchema['x-uid'],
              };
              const path = field.path?.splice(field.path?.length - 1, 1);
              switch (v) {
                case 'readonly': {
                  fieldSchema['x-read-pretty'] = false;
                  fieldSchema['x-disabled'] = true;
                  schema['x-read-pretty'] = false;
                  schema['x-disabled'] = true;
                  field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                    f.readonly = true;
                    f.disabled = true;
                  });
                  break;
                }
                case 'read-pretty': {
                  fieldSchema['x-read-pretty'] = true;
                  fieldSchema['x-disabled'] = false;
                  schema['x-read-pretty'] = true;
                  schema['x-disabled'] = false;
                  field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                    f.readPretty = true;
                  });
                  break;
                }
                default: {
                  fieldSchema['x-read-pretty'] = false;
                  fieldSchema['x-disabled'] = false;
                  schema['x-read-pretty'] = false;
                  schema['x-disabled'] = false;
                  field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                    f.readPretty = false;
                    f.disabled + false;
                  });
                  break;
                }
              }

              dn.emit('patch', {
                schema,
              });

              dn.refresh();
            }}
          />
        )}
      {isDateField && <SchemaSettingsDateFormat fieldSchema={fieldSchema} />}
      {isSubTableColumn &&
        !field?.readPretty &&
        ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface) && (
          <SchemaSettingsSortingRule
            fieldSchema={fieldSchema}
            onSubmitCallBack={(sortArr) => {
              const path = field.path?.splice(field.path?.length - 1, 1);
              field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                f.componentProps.service = f.componentProps.service || { params: {} };
                f.componentProps.service.params.sort = sortArr;
              });
            }}
          />
        )}
      {isAllowToSetDefaultValue(isSubTableColumn) && <SchemaSettingsDefaultValue fieldSchema={fieldSchema} />}
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren={!isSubTableColumn}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
        confirm={{
          title: t('Delete table column'),
        }}
      />
    </GeneralSchemaDesigner>
  );
};

function isFileCollection(collection) {
  return collection?.template === 'file';
}
