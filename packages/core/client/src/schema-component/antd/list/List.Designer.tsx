/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { useCollection_deprecated, useSortFields } from '../../../collection-manager';
import { SetDataLoadingMode } from '../../../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
} from '../../../schema-settings';
import { SchemaSettingsBlockTitleItem } from '../../../schema-settings/SchemaSettingsBlockTitleItem';
import { SchemaSettingsDataScope } from '../../../schema-settings/SchemaSettingsDataScope';
import { SchemaSettingsTemplate } from '../../../schema-settings/SchemaSettingsTemplate';
import { useSchemaTemplate } from '../../../schema-templates';
import { useBlockTemplateContext } from '../../../schema-templates/BlockTemplateProvider';
import { useCompile, useDesignable } from '../../hooks';
import { removeNullCondition } from '../filter';
import { useApp } from '../../../application';

/**
 * @deprecated - 已使用 SchemaSettings 替代
 */
export const ListDesigner = () => {
  const app = useApp();
  const compile = useCompile();
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const field = useField();
  const { dn } = useDesignable();
  const sortFields = useSortFields(name);
  const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
  const defaultResource =
    fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
  const sort = defaultSort?.map((item: string) => {
    return item.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });
  const { componentNamePrefix } = useBlockTemplateContext();
  const RevertSetting =
    app.schemaSettingsManager.getAll()['blockSettings:list']?.get('template-revertSettingItem')?.['Component'] || null;
  let designerTitle = title;
  if (fieldSchema['x-template-uid']) {
    designerTitle = `${compile(title)} [${t('Template')}: ${compile(fieldSchema['x-template-title'])}]`;
  }

  return (
    <GeneralSchemaDesigner template={template} title={designerTitle || name}>
      <SchemaSettingsBlockTitleItem />
      <SchemaSettingsDataScope
        collectionName={name}
        defaultFilter={fieldSchema?.['x-decorator-props']?.params?.filter || {}}
        form={form}
        onSubmit={({ filter }) => {
          filter = removeNullCondition(filter);
          _.set(fieldSchema, 'x-decorator-props.params.filter', filter);
          field.decoratorProps.params = { ...fieldSchema['x-decorator-props'].params, page: 1 };
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettingsModalItem
        title={t('Set default sorting rules')}
        components={{ ArrayItems }}
        schema={
          {
            type: 'object',
            title: t('Set default sorting rules'),
            properties: {
              sort: {
                type: 'array',
                default: sort,
                'x-component': 'ArrayItems',
                'x-decorator': 'FormItem',
                items: {
                  type: 'object',
                  properties: {
                    space: {
                      type: 'void',
                      'x-component': 'Space',
                      properties: {
                        sort: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.SortHandle',
                        },
                        field: {
                          type: 'string',
                          enum: sortFields,
                          'x-decorator': 'FormItem',
                          'x-component': 'Select',
                          'x-component-props': {
                            style: {
                              width: 260,
                            },
                          },
                        },
                        direction: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'Radio.Group',
                          'x-component-props': {
                            optionType: 'button',
                          },
                          enum: [
                            {
                              label: t('ASC'),
                              value: 'asc',
                            },
                            {
                              label: t('DESC'),
                              value: 'desc',
                            },
                          ],
                        },
                        remove: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.Remove',
                        },
                      },
                    },
                  },
                },
                properties: {
                  add: {
                    type: 'void',
                    title: t('Add sort field'),
                    'x-component': 'ArrayItems.Addition',
                  },
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ sort }) => {
          const sortArr = sort.map((item) => {
            return item.direction === 'desc' ? `-${item.field}` : item.field;
          });

          _.set(fieldSchema, 'x-decorator-props.params.sort', sortArr);
          field.decoratorProps.params = { ...fieldSchema['x-decorator-props'].params, page: 1 };
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SetDataLoadingMode />
      <SchemaSettingsSelectItem
        title={t('Records per page')}
        value={field.decoratorProps?.params?.pageSize || 20}
        options={[
          { label: '5', value: 5 },
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '50', value: 50 },
          { label: '100', value: 100 },
          { label: '200', value: 200 },
        ]}
        onChange={(pageSize) => {
          _.set(fieldSchema, 'x-decorator-props.params.pageSize', pageSize);
          field.decoratorProps.params = { ...fieldSchema['x-decorator-props'].params, page: 1 };
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      {!fieldSchema['x-template-uid'] ? (
        <>
          {!RevertSetting && (
            <SchemaSettingsTemplate
              componentName={`${componentNamePrefix}List`}
              collectionName={name}
              resourceName={defaultResource}
            />
          )}
          <SchemaSettingsDivider />
          <SchemaSettingsRemove
            removeParentsIfNoChildren
            breakRemoveOn={{
              'x-component': 'Grid',
            }}
          />
        </>
      ) : (
        <RevertSetting />
      )}
    </GeneralSchemaDesigner>
  );
};
