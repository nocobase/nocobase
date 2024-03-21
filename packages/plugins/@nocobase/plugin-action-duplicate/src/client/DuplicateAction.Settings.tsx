import { onFieldInputValueChange } from '@formily/core';
import { ISchema, connect, mapProps, useField, useFieldSchema, useForm } from '@formily/react';
import {
  ActionDesigner,
  SchemaSettingOpenModeSchemaItems,
  useCollection_deprecated,
  useRecord,
  SchemaSettingsModalItem,
  SchemaSettingsItemType,
  SchemaSettingsLinkageRules,
  useCollectionState,
  useDesignable,
  useSchemaToolbar,
  useSyncFromForm,
  SchemaSettings,
} from '@nocobase/client';
import { Tree as AntdTree } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Tree = connect(
  AntdTree,
  mapProps((props, field: any) => {
    useEffect(() => {
      field.value = props.defaultCheckedKeys || [];
    }, []);
    const [checkedKeys, setCheckedKeys] = useState(props.defaultCheckedKeys || []);
    const onCheck = (checkedKeys) => {
      setCheckedKeys(checkedKeys);
      field.value = checkedKeys;
    };
    field.onCheck = onCheck;
    const form = useForm();
    return {
      ...props,
      checkedKeys,
      onCheck,
      treeData: props?.treeData.map((v: any) => {
        if (form.values.duplicateMode === 'quickDulicate') {
          const children = v?.children?.map((k) => {
            return {
              ...k,
              disabled: false,
            };
          });
          return {
            ...v,
            disabled: false,
            children,
          };
        }
        return v;
      }),
    };
  }),
);

const getAllkeys = (data, result) => {
  for (let i = 0; i < data?.length; i++) {
    const { children, ...rest } = data[i];
    result.push(rest.key);
    if (children) {
      getAllkeys(children, result);
    }
  }
  return result;
};
const findFormBlock = (schema) => {
  const formSchema = schema.reduceProperties((_, s) => {
    if (s['x-decorator'] === 'FormBlockProvider') {
      return s;
    } else {
      return findFormBlock(s);
    }
  }, null);
  return formSchema;
};

function DuplicationMode() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { name } = useCollection_deprecated();
  const { collectionList, getEnableFieldTree, getOnLoadData, getOnCheck } = useCollectionState(name);
  const duplicateValues = cloneDeep(fieldSchema['x-component-props'].duplicateFields || []);
  const record = useRecord();
  const syncCallBack = useCallback((treeData, selectFields, form) => {
    form.query('duplicateFields').take((f) => {
      f.componentProps.treeData = treeData;
      f.componentProps.defaultCheckedKeys = selectFields;
      f.setInitialValue(selectFields);
      f?.onCheck(selectFields);
      form.setValues({ ...form.values, treeData });
    });
  }, []);
  const useSelectAllFields = (form) => {
    return {
      async run() {
        form.query('duplicateFields').take((f) => {
          const selectFields = getAllkeys(f.componentProps.treeData, []);
          f.componentProps.defaultCheckedKeys = selectFields;
          f.setInitialValue(selectFields);
          f?.onCheck?.(selectFields);
        });
      },
    };
  };
  const useUnSelectAllFields = (form) => {
    return {
      async run() {
        form.query('duplicateFields').take((f) => {
          f.componentProps.defaultCheckedKeys = [];
          f.setInitialValue([]);
          f?.onCheck([]);
        });
      },
    };
  };
  return (
    <SchemaSettingsModalItem
      title={t('Duplicate mode')}
      components={{ Tree }}
      scope={{
        getEnableFieldTree,
        collectionName: fieldSchema['x-component-props']?.duplicateCollection || record?.__collection || name,
        currentCollection: record?.__collection || name,
        getOnLoadData,
        getOnCheck,
        treeData: fieldSchema['x-component-props']?.treeData,
        duplicateValues,
        onFieldInputValueChange,
      }}
      schema={
        {
          type: 'object',
          title: t('Duplicate mode'),
          properties: {
            duplicateMode: {
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              title: t('Duplicate mode'),
              default: fieldSchema['x-component-props']?.duplicateMode || 'quickDulicate',
              enum: [
                { value: 'quickDulicate', label: '{{t("Direct duplicate")}}' },
                { value: 'continueduplicate', label: '{{t("Copy into the form and continue to fill in")}}' },
              ],
            },
            collection: {
              type: 'string',
              title: '{{ t("Target collection") }}',
              required: true,
              description: t('If collection inherits, choose inherited collections as templates'),
              default: '{{ collectionName }}',
              'x-display': collectionList.length > 1 ? 'visible' : 'hidden',
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              'x-component-props': {
                options: collectionList,
              },
              'x-reactions': [
                {
                  dependencies: ['.duplicateMode'],
                  fulfill: {
                    state: {
                      disabled: `{{ $deps[0]==="quickDulicate" }}`,
                      value: `{{ $deps[0]==="quickDulicate"? currentCollection:collectionName }}`,
                    },
                  },
                },
              ],
            },
            syncFromForm: {
              type: 'void',
              title: '{{ t("Sync from form fields") }}',
              'x-component': 'Action.Link',
              'x-component-props': {
                type: 'primary',
                style: { float: 'right', position: 'relative', zIndex: 1200 },
                useAction: () => {
                  const formSchema = useMemo(() => findFormBlock(fieldSchema), [fieldSchema]);
                  return useSyncFromForm(
                    formSchema,
                    fieldSchema['x-component-props']?.duplicateCollection || record?.__collection || name,
                    syncCallBack,
                  );
                },
              },
              'x-reactions': [
                {
                  dependencies: ['.duplicateMode'],
                  fulfill: {
                    state: {
                      visible: `{{ $deps[0]!=="quickDulicate" }}`,
                    },
                  },
                },
              ],
            },
            selectAll: {
              type: 'void',
              title: '{{ t("Select all") }}',
              'x-component': 'Action.Link',
              'x-reactions': [
                {
                  dependencies: ['.duplicateMode'],
                  fulfill: {
                    state: {
                      visible: `{{ $deps[0]==="quickDulicate"}}`,
                    },
                  },
                },
              ],
              'x-component-props': {
                type: 'primary',
                style: { float: 'right', position: 'relative', zIndex: 1200 },
                useAction: () => {
                  const from = useForm();
                  return useSelectAllFields(from);
                },
              },
            },
            unselectAll: {
              type: 'void',
              title: '{{ t("UnSelect all") }}',
              'x-component': 'Action.Link',
              'x-reactions': [
                {
                  dependencies: ['.duplicateMode', '.duplicateFields'],
                  fulfill: {
                    state: {
                      visible: `{{ $deps[0]==="quickDulicate"&&$form.getValuesIn('duplicateFields').length>0 }}`,
                    },
                  },
                },
              ],
              'x-component-props': {
                type: 'primary',
                style: { float: 'right', position: 'relative', zIndex: 1200, marginRight: '10px' },
                useAction: () => {
                  const from = useForm();
                  return useUnSelectAllFields(from);
                },
              },
            },
            duplicateFields: {
              type: 'array',
              title: '{{ t("Data fields") }}',
              required: true,
              description: t('Only the selected fields will be used as the initialization data for the form'),
              'x-decorator': 'FormItem',
              'x-component': Tree,
              'x-component-props': {
                defaultCheckedKeys: duplicateValues,
                treeData: [],
                checkable: true,
                checkStrictly: true,
                selectable: false,
                loadData: '{{ getOnLoadData($self) }}',
                onCheck: '{{ getOnCheck($self) }}',
                rootStyle: {
                  padding: '8px 0',
                  border: '1px solid #d9d9d9',
                  borderRadius: '2px',
                  maxHeight: '30vh',
                  overflow: 'auto',
                  margin: '2px 0',
                },
              },
              'x-reactions': [
                {
                  dependencies: ['.collection', '.duplicateMode'],
                  fulfill: {
                    state: {
                      disabled: '{{ !$deps[0] }}',
                      componentProps: {
                        treeData: '{{ getEnableFieldTree($deps[0], $self,treeData) }}',
                      },
                    },
                  },
                },
              ],
            },
          },
        } as ISchema
      }
      onSubmit={({ duplicateMode, collection, duplicateFields, treeData }) => {
        const fields = Array.isArray(duplicateFields) ? duplicateFields : duplicateFields.checked || [];
        field.componentProps.duplicateMode = duplicateMode;
        field.componentProps.duplicateFields = fields;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].duplicateMode = duplicateMode;
        fieldSchema['x-component-props'].duplicateFields = fields;
        fieldSchema['x-component-props'].duplicateCollection = collection;
        fieldSchema['x-component-props'].treeData = treeData || field.componentProps?.treeData;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema['x-component-props'],
            },
          },
        });
        dn.refresh();
      }}
    />
  );
}

const schemaSettingsItems: SchemaSettingsItemType[] = [
  {
    name: 'Customize',
    Component: (props): any => {
      return props.children;
    },
    children: [
      {
        name: 'editButton',
        Component: ActionDesigner.ButtonEditor,
        useComponentProps() {
          const { buttonEditorProps } = useSchemaToolbar();
          return buttonEditorProps;
        },
      },
      {
        name: 'linkageRules',
        Component: SchemaSettingsLinkageRules,
        useComponentProps() {
          const { name } = useCollection_deprecated();
          const { linkageRulesProps } = useSchemaToolbar();
          return {
            ...linkageRulesProps,
            collectionName: name,
          };
        },
      },
      {
        name: 'duplicationMode',
        Component: DuplicationMode,
        useVisible() {
          const fieldSchema = useFieldSchema();
          const isDuplicateAction = fieldSchema['x-action'] === 'duplicate';
          return isDuplicateAction;
        },
      },
      {
        name: 'openMode',
        Component: SchemaSettingOpenModeSchemaItems,
        useComponentProps() {
          const fieldSchema = useFieldSchema();
          const isPopupAction = [
            'create',
            'update',
            'view',
            'customize:popup',
            'duplicate',
            'customize:create',
          ].includes(fieldSchema['x-action'] || '');

          return {
            openMode: isPopupAction,
            openSize: isPopupAction,
          };
        },
      },
      {
        name: 'remove',
        sort: 100,
        Component: ActionDesigner.RemoveButton as any,
        useComponentProps() {
          const { removeButtonProps } = useSchemaToolbar();
          return removeButtonProps;
        },
      },
    ],
  },
];

/**
 * @deprecated
 * 用于兼容之前的 name
 */
const deprecatedDuplicateActionSettings = new SchemaSettings({
  name: 'ActionSettings:duplicate',
  items: schemaSettingsItems,
});

const duplicateActionSettings = new SchemaSettings({
  name: 'actionSettings:duplicate',
  items: schemaSettingsItems,
});

export { deprecatedDuplicateActionSettings, duplicateActionSettings };
