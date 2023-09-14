import { ISchema, useField, useFieldSchema } from '@formily/react';
import { set } from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrayItems } from '@formily/antd-v5';
import { useCollectionFilterOptions, useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings, isPatternDisabled, isShowDefaultValue } from '../../../schema-settings';
import { useCompile, useDesignable, useFieldModeOptions } from '../../hooks';
import { useAssociationFieldContext } from '../association-field/hooks';
import { removeNullCondition } from '../filter';
import { FilterDynamicComponent } from './FilterDynamicComponent';

const useLabelFields = (collectionName?: any) => {
  // 需要在组件顶层调用
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  if (!collectionName) {
    return [];
  }
  const targetFields = getCollectionFields(collectionName);
  return targetFields
    ?.filter?.((field) => field?.interface && !field?.target && field.type !== 'boolean' && !field.isForeignKey)
    ?.map?.((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title || field.name),
      };
    });
};

export const useColorFields = (collectionName?: any) => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
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
  const { getInterface, getCollection } = useCollectionManager();
  const field: any = useField();
  const { t } = useTranslation();
  const columnSchema = useFieldSchema();
  const { dn } = useDesignable();
  const fieldNames =
    fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
  const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);
  const colorFieldOptions = useColorFields(collectionField?.target ?? collectionField?.targetCollection);
  const intefaceCfg = getInterface(collectionField?.interface);
  const targetCollection = getCollection(collectionField?.target);
  const isFileField = isFileCollection(targetCollection);
  const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
  const { currentMode } = useAssociationFieldContext();
  const defaultFilter = fieldSchema?.['x-component-props']?.service?.params?.filter || {};
  const dataSource = useCollectionFilterOptions(collectionField?.target);
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
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettings.ModalItem
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
        <SchemaSettings.ModalItem
          title={t('Set the data scope')}
          schema={
            {
              type: 'object',
              title: t('Set the data scope'),
              properties: {
                filter: {
                  default: defaultFilter,
                  enum: dataSource,
                  'x-component': 'Filter',
                  'x-component-props': {
                    dynamicComponent: (props) => FilterDynamicComponent({ ...props }),
                  },
                },
              },
            } as ISchema
          }
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
      <SchemaSettings.ModalItem
        title={t('Column width')}
        schema={
          {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
      {intefaceCfg && intefaceCfg.sortable === true && !currentMode && (
        <SchemaSettings.SwitchItem
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
        readOnlyMode === 'read-pretty' && (
          <SchemaSettings.SwitchItem
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
        <SchemaSettings.SelectItem
          title={t('Title field')}
          options={options}
          value={fieldNames?.['label']}
          onChange={(label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
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
        <SchemaSettings.SelectItem
          key="field-mode"
          title={t('Field component')}
          options={
            readOnlyMode === 'read-pretty'
              ? [
                  { label: t('Title'), value: 'Select' },
                  { label: t('Tag'), value: 'Tag' },
                ]
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
        <SchemaSettings.SelectItem
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
        <SchemaSettings.SwitchItem
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
          <SchemaSettings.SelectItem
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
      {isDateField && <SchemaSettings.DataFormat fieldSchema={fieldSchema} />}
      {isSubTableColumn &&
        !field?.readPretty &&
        ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface) && (
          <SchemaSettings.SortingRule
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
      {isSubTableColumn && !field?.readPretty && isShowDefaultValue(collectionField, getInterface) && (
        <SchemaSettings.DefaultValue fieldSchema={fieldSchema} />
      )}
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
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
