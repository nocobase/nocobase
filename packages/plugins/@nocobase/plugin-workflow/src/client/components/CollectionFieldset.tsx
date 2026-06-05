/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, useForm } from '@formily/react';
import { ISchema } from '@formily/json-schema';
import {
  CollectionProvider_deprecated,
  SchemaComponent,
  Variable,
  parseCollectionName,
  useCollectionManager_deprecated,
  useCompile,
  useToken,
  Fieldset,
} from '@nocobase/client';
import { Button, Dropdown, Form, MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { lang } from '../locale';
import { useWorkflowVariableOptions } from '../variable';

const fieldItemClassName = css`
  position: relative;

  .ant-form-item-label > label {
    padding-right: 32px;
    font-weight: 600;
  }
`;

const CollectionFieldSetItem = observer(
  ({ field, value, disabled, collectionName, dataSourceName, onChange, onRemove }: any) => {
    const compile = useCompile();
    const scope = useWorkflowVariableOptions();
    const { getCollection, getInterface } = useCollectionManager_deprecated();

    const fieldSchema = useMemo<ISchema>(() => {
      const targetCollection = field.target ? getCollection(field.target, dataSourceName) : undefined;
      const interfaceConfig = field.interface ? getInterface(field.interface) : undefined;
      const nextFieldSchema: ISchema = {
        type: field.uiSchema?.type || 'string',
        'x-component': 'CollectionField',
        'x-collection-field': `${collectionName}.${field.name}`,
        'x-component-props': {
          ...(field.uiSchema?.['x-component-props'] || {}),
          disabled,
        },
        ['x-validator']() {
          return '';
        },
      };

      interfaceConfig?.schemaInitialize?.(nextFieldSchema, {
        field,
        block: 'Form',
        readPretty: false,
        targetCollection,
      });

      nextFieldSchema['x-component-props'] = {
        ...(nextFieldSchema['x-component-props'] || {}),
        disabled,
      };

      return nextFieldSchema;
    }, [collectionName, dataSourceName, disabled, field, getCollection, getInterface]);

    return (
      <div style={{ position: 'relative' }}>
        <Form.Item
          key={field.name}
          className={fieldItemClassName}
          label={compile(field.uiSchema?.title ?? field.name)}
          labelAlign="left"
          layout="vertical"
          colon
        >
          <Variable.Input scope={scope} value={value} changeOnSelect onChange={onChange}>
            <SchemaComponent
              schema={{
                type: 'void',
                properties: {
                  [field.name]: fieldSchema,
                },
              }}
            />
          </Variable.Input>
        </Form.Item>
        {!disabled ? (
          <Button
            aria-label="icon-close"
            type="link"
            icon={<CloseCircleOutlined />}
            onClick={onRemove}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              paddingInline: 0,
            }}
          />
        ) : null}
      </div>
    );
  },
  { displayName: 'CollectionFieldSetItem' },
);

/**
 * @deprecated
 */
const CollectionFieldSet = observer(
  ({ value, disabled, onChange, filter }: any) => {
    const { token } = useToken();
    const { t } = useTranslation();
    const compile = useCompile();
    const form = useForm();
    const { getCollectionFields } = useCollectionManager_deprecated();
    const { values: config } = form;
    const [dataSourceName, collectionName] = parseCollectionName(config?.collection);
    const collectionFields = getCollectionFields(collectionName, dataSourceName).filter((field) => field.uiSchema);
    const fields = filter ? collectionFields.filter(filter.bind(config)) : collectionFields;

    const unassignedFields = useMemo(() => fields.filter((field) => !value || !(field.name in value)), [fields, value]);
    const mergedDisabled = disabled || form.disabled;
    const menu = useMemo<MenuProps>(() => {
      return {
        onClick: ({ key }) => {
          onChange({ ...value, [key]: null });
        },
        style: {
          maxHeight: 300,
          overflowY: 'auto',
        },
        items: unassignedFields.map((field) => ({
          key: field.name,
          label: compile(field.uiSchema?.title ?? field.name),
        })),
      };
    }, [compile, onChange, unassignedFields, value]);

    return (
      <Fieldset>
        {fields.length ? (
          <CollectionProvider_deprecated name={collectionName} dataSource={dataSourceName}>
            {fields
              .filter((field) => value && field.name in value)
              .map((field) => {
                return (
                  <CollectionFieldSetItem
                    key={field.name}
                    field={field}
                    value={value[field.name]}
                    disabled={mergedDisabled}
                    collectionName={collectionName}
                    dataSourceName={dataSourceName}
                    onChange={(next: any) => {
                      onChange({ ...value, [field.name]: next });
                    }}
                    onRemove={() => {
                      const { [field.name]: _, ...rest } = value;
                      onChange(rest);
                    }}
                  />
                );
              })}
            {unassignedFields.length ? (
              <Dropdown menu={menu}>
                <Button icon={<PlusOutlined />}>{t('Add field')}</Button>
              </Dropdown>
            ) : null}
          </CollectionProvider_deprecated>
        ) : (
          <p style={{ color: token.colorText }}>{lang('Please select collection first')}</p>
        )}
      </Fieldset>
    );
  },
  { displayName: 'CollectionFieldSet' },
);

export default CollectionFieldSet;
