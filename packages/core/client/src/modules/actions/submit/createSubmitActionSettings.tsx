/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, connect, mapProps, useField, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { Tree as AntdTree } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../collection-manager';
import { useDesignable } from '../../../schema-component';
import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  RefreshDataBlockRequest,
  RemoveButton,
  SecondConFirm,
  SkipValidation,
} from '../../../schema-component/antd/action/Action.Designer';
import { useCollectionState } from '../../../schema-settings/DataTemplates/hooks/useCollectionState';
import { SchemaSettingsModalItem } from '../../../schema-settings/SchemaSettings';
import { useParentPopupRecord } from '../../variable/variablesProvider/VariablePopupRecordProvider';
import { useDataBlockProps } from '../../../data-source';
import { SchemaSettingsLinkageRules } from '../../../schema-settings';

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
    return {
      ...props,
      checkedKeys,
      onCheck,
    };
  }),
);
export function SaveMode() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { name } = useCollection_deprecated();
  const { getEnableFieldTree, getOnLoadData } = useCollectionState(name, false, (field) => {
    return ['belongsTo', 'belongsToMany', 'hasOne', 'hasMany'].includes(field.type);
  });
  return (
    <SchemaSettingsModalItem
      title={t('Save mode')}
      components={{ Tree }}
      scope={{ getEnableFieldTree, name, getOnLoadData }}
      schema={
        {
          type: 'object',
          title: t('Save mode'),
          properties: {
            saveMode: {
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              default: field.componentProps.saveMode || 'create',
              enum: [
                { value: 'create', label: '{{t("Insert")}}' },
                { value: 'firstOrCreate', label: '{{t("Insert if not exists")}}' },
                { value: 'updateOrCreate', label: '{{t("Insert if not exists, or update")}}' },
              ],
            },
            filterKeys: {
              type: 'array',
              title: '{{ t("Determine whether a record exists by the following fields") }}',
              required: true,
              default: field.componentProps.filterKeys,
              'x-decorator': 'FormItem',
              'x-component': 'Tree',
              'x-component-props': {
                treeData: [],
                checkable: true,
                checkStrictly: true,
                selectable: false,
                loadData: '{{ getOnLoadData($self) }}',
                defaultCheckedKeys: field.componentProps.filterKeys,
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
                  dependencies: ['.saveMode'],
                  fulfill: {
                    state: {
                      hidden: '{{ $deps[0]==="create"}}',
                      componentProps: {
                        treeData: '{{ getEnableFieldTree(name, $self) }}',
                      },
                    },
                  },
                },
              ],
            },
          },
        } as ISchema
      }
      onSubmit={({ saveMode, filterKeys }) => {
        field.componentProps.saveMode = saveMode;
        field.componentProps.filterKeys = filterKeys;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].saveMode = saveMode;
        fieldSchema['x-component-props'].filterKeys = filterKeys;
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

export const createSubmitActionSettings = new SchemaSettings({
  name: 'actionSettings:createSubmit',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },
    {
      name: 'saveMode',
      Component: SaveMode,
      useVisible() {
        const { type } = useDataBlockProps() || ({} as any);
        return type !== 'publicForm';
      },
    },
    {
      name: 'assignFieldValues',
      Component: AssignedFieldValues,
    },
    {
      name: 'skipRequiredValidation',
      Component: SkipValidation,
    },
    {
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
      useVisible() {
        const { type } = useDataBlockProps() || ({} as any);
        return type !== 'publicForm';
      },
    },
    {
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
      },
      useVisible() {
        const parentRecord = useParentPopupRecord();
        return !!parentRecord;
      },
    },
    {
      name: 'remove',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});
